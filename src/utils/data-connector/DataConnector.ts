import { openDB } from "idb";
import type { IDBPDatabase } from "idb";

import type {
  CacheOptions,
  IDataConnector,
  StorageResult,
  StorageUsage,
  ChannelStorageInput,
  StoredChannelData,
  StorageInput,
  ILRUCache,
  StoreName,
  StorageReference,
} from "./types";
import { STORES, DB_NAME, DB_VERSION } from "./types";
import { parseError } from "utils/logUtils";
import { LRUCache, NullCache } from "./lruCache";

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  maxMemoryBytes: 500 * 1024 * 1024, // 500MB
  persistAcrossSessions: true,
  useCache: true,
};

/**
 * DataConnector
 *
 * Manages persistent storage of data in IndexedDB with an in-memory
 * LRU cache for fast access. This service replaces storing Tensor4D objects
 * directly in Redux state.
 *
 * Key responsibilities:
 * - Store/retrieve tensor data from IndexedDB
 * - Maintain LRU cache for frequently accessed tensors
 * - Track storage usage and provide cleanup utilities
 *
 * Usage:
 * ```typescript
 * const storage = DataConnector.getInstance();
 *
 *  Store
 * const ref = await storage.store('image-123', data, {STORE});
 *
 *  Retrieve
 * const data = await storage.retrieve('image-123', {STORE});
 *
 * ```
 */

export class DataConnector implements IDataConnector {
  private static instance: DataConnector | null = null;

  private db: IDBPDatabase | null = null;
  private cache: ILRUCache<StoredChannelData>;
  private options: CacheOptions;
  private initPromise: Promise<void> | null = null;

  private constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
    if (options.useCache !== false)
      this.cache = new LRUCache<StoredChannelData>(this.options.maxMemoryBytes);
    else this.cache = new NullCache<StoredChannelData>();
  }

  // ===========================================================================
  // PUBLIC API: BEGIN
  // ===========================================================================

  /**
   * Get singleton instance
   */
  static getInstance(options?: Partial<CacheOptions>): DataConnector {
    if (!DataConnector.instance) {
      DataConnector.instance = new DataConnector(options);
    }
    return DataConnector.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (DataConnector.instance) {
      DataConnector.instance.close();
      DataConnector.instance = null;
    }
  }

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initDB();
    await this.initPromise;
  }

  private async initDB(): Promise<void> {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.CHANNEL_DATA)) {
          db.createObjectStore(STORES.CHANNEL_DATA, { keyPath: "id" });
        }
      },
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.cache && this.cache.clear();
    this.initPromise = null;
  }

  // ── Core Storage ───────────────────────────────────────────────────

  async store(
    id: string,
    data: ChannelStorageInput,
    storeName: StoreName,
  ): Promise<StorageResult<StorageReference>> {
    try {
      await this.init();
      const now = Date.now();
      const byteSize = data.data.byteLength + data.histogram.byteLength;

      const storedData: StoredChannelData = {
        ...data,
        byteSize,
        createdAt: now,
      };

      // Store in IndexedDB
      await this.db!.put(storeName, storedData);

      // Also add to cache
      this.cache.set(id, storedData, byteSize);

      const reference: StorageReference = {
        storageId: id,
        storeName,
        width: data.width,
        height: data.height,
        dtype: data.dtype,
        byteSize,
      };
      return { success: true, data: reference };
    } catch (error) {
      return {
        success: false,
        error: parseError(error),
      };
    }
  }

  async storeBatch(
    items: Array<StorageInput>,
  ): Promise<StorageResult<StorageReference[]>> {
    try {
      await this.init();

      const now = Date.now();
      const references: StorageReference[] = [];

      // Group by store for efficient transactions
      const byStore = new Map<StoreName, StoredChannelData[]>();

      for (const item of items) {
        const byteSize =
          item.data.data.byteLength + item.data.histogram.byteLength;

        const storedData: StoredChannelData = {
          ...item.data,
          byteSize,
          createdAt: now,
        };

        if (!byStore.has(item.storeName)) {
          byStore.set(item.storeName, []);
        }
        byStore.get(item.storeName)!.push(storedData);

        // Add to cache
        this.cache.set(item.id, storedData, byteSize);

        references.push({
          storageId: item.id,
          storeName: item.storeName,
          width: item.data.width,
          height: item.data.height,
          dtype: item.data.dtype,
          byteSize,
        });
      }

      for (const [storeName, dataItems] of byStore) {
        const tx = this.db!.transaction(storeName, "readwrite");
        await Promise.all([
          ...dataItems.map((item) => tx.store.put(item)),
          tx.done,
        ]);
      }
      return { success: true, data: references };
    } catch (error) {
      return {
        success: false,
        error: parseError(error),
      };
    }
  }

  // ── Retrieval ──────────────────────────────────────────────────────

  async retrieve(
    id: string,
    storeName: StoreName,
  ): Promise<StorageResult<StoredChannelData>> {
    try {
      const cached = this.cache.get(id);
      if (cached) {
        return { success: true, data: cached };
      }

      await this.init();

      const data = await this.db!.get(storeName, id);

      if (!data) {
        return { success: false, error: new Error(`Tensor not found ${id}`) };
      }

      // Add to cache
      this.cache.set(id, data, data.byteSize);

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: parseError(error),
      };
    }
  }

  async retrieveBatch(
    items: { id: string; storeName: StoreName }[],
  ): Promise<StorageResult<Map<string, StoredChannelData>>> {
    const channelDataMap: Map<string, StoredChannelData> = new Map();
    try {
      await this.init();

      // Group by store
      const byStore = new Map<StoreName, string[]>();
      for (const item of items) {
        const cached = this.cache.get(item.id);
        if (cached) {
          channelDataMap.set(item.id, cached);
          continue;
        }

        if (!byStore.has(item.storeName)) {
          byStore.set(item.storeName, []);
        }
        byStore.get(item.storeName)!.push(item.id);
      }

      // retrieve from each store
      for (const [storeName, ids] of byStore) {
        const tx = this.db!.transaction(storeName, "readonly");
        const fetched = await Promise.all(ids.map((id) => tx.store.get(id)));
        await tx.done;

        for (let i = 0; i < ids.length; i++) {
          const data = fetched[i] as StoredChannelData | undefined;
          if (data) {
            this.cache.set(data.id, data, data.byteSize);
            channelDataMap.set(data.id, data);
          }
        }
      }

      return { success: true, data: channelDataMap };
    } catch (error) {
      return {
        success: false,
        error: parseError(error),
      };
    }
  }

  // ── Deletion ───────────────────────────────────────────────────────

  async delete(id: string, storeName: StoreName): Promise<StorageResult<void>> {
    try {
      await this.init();
      await this.db!.delete(storeName, id);
      this.cache.delete(id);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: parseError(error),
      };
    }
  }

  async deleteBatch(
    items: Array<{ id: string; storeName: StoreName }>,
  ): Promise<StorageResult<void>> {
    try {
      await this.init();

      // Group by store
      const byStore = new Map<StoreName, string[]>();
      for (const item of items) {
        if (!byStore.has(item.storeName)) {
          byStore.set(item.storeName, []);
        }
        byStore.get(item.storeName)!.push(item.id);
        this.cache.delete(item.id);
      }

      // Delete from each store
      for (const [storeName, ids] of byStore) {
        const tx = this.db!.transaction(storeName, "readwrite");
        await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: parseError(error),
      };
    }
  }

  // ── Cache Management ───────────────────────────────────────────────

  async preload(ids: string[], storeName: StoreName): Promise<void> {
    await this.init();

    for (const id of ids) {
      if (!this.cache.has(id)) {
        await this.retrieve(id, storeName);
      }
    }
  }

  evictFromCache(ids: string[]): void {
    for (const id of ids) {
      this.cache.delete(id);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  setCacheLimit(maxBytes: number): void {
    this.options.maxMemoryBytes = maxBytes;
    this.cache.setMaxBytes(maxBytes);
  }

  // ── Storage Management ─────────────────────────────────────────────

  async getUsage(): Promise<StorageUsage> {
    await this.init();

    let totalSize = 0;
    let itemCount = 0;

    for (const storeName of [STORES.CHANNEL_DATA]) {
      const tx = this.db!.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);

      let cursor = await store.openCursor();
      while (cursor) {
        totalSize += (cursor.value as StoredChannelData).byteSize;
        itemCount++;
        cursor = await cursor.continue();
      }
    }

    let available = 0;
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      available = (estimate.quota ?? 0) - (estimate.usage ?? 0);
    }

    const cacheStats = this.cache.getStats();

    return {
      used: totalSize,
      available,
      itemCount,
      cacheHitRate: cacheStats.hitRate,
    };
  }

  async getStoredIds(storeName: StoreName): Promise<string[]> {
    await this.init();
    return this.db!.getAllKeys(storeName) as Promise<string[]>;
  }

  async clearAll(): Promise<StorageResult<void>> {
    try {
      await this.init();

      for (const storeName of [STORES.CHANNEL_DATA]) {
        await this.db!.clear(storeName);
      }
      this.cache.clear();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: parseError(error),
      };
    }
  }

  async clearOlderThan(
    maxAgeMs: number,
    storeName: StoreName,
  ): Promise<StorageResult<number>> {
    try {
      await this.init();

      const cutoff = Date.now() - maxAgeMs;

      let deletedCount = 0;

      const tx = this.db!.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      let cursor = await store.openCursor();
      while (cursor) {
        const data = cursor.value as StoredChannelData;
        if (data.createdAt < cutoff) {
          await cursor.delete();
          this.cache.delete(data.id);
          deletedCount++;
        }
        cursor = await cursor.continue();
      }

      await tx.done;

      return { success: true, data: deletedCount };
    } catch (error) {
      return { success: false, error: parseError(error) };
    }
  }
}
