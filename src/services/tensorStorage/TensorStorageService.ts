import { openDB, IDBPDatabase } from "idb";
import { Tensor4D, tensor4d } from "@tensorflow/tfjs";

import {
  DB_NAME,
  DB_VERSION,
  STORES,
  StoreName,
  StoredTensorData,
  TensorReference,
  StorageResult,
  StorageUsage,
  CacheOptions,
  PreparedChannelData,
} from "./types";
import { LRUCache } from "./lruCache";
import { parseError } from "utils/errorUtils";

/**
 * Calculate total byte size of stored tensor data
 * Includes buffer + prepared channels + rendered src
 */
function calculateByteSize(data: {
  buffer: ArrayBuffer;
  preparedChannels?: PreparedChannelData;
  renderedSrc?: string;
}): number {
  let size = data.buffer.byteLength;

  if (data.preparedChannels) {
    // Each number in JS is 8 bytes (64-bit float)
    for (const channel of data.preparedChannels.data) {
      size += channel.length * 8;
    }
    if (data.preparedChannels.histograms) {
      for (const histogram of data.preparedChannels.histograms) {
        size += histogram.length * 8;
      }
    }
  }

  if (data.renderedSrc) {
    // String bytes (approximate - 2 bytes per char in JS)
    size += data.renderedSrc.length * 2;
  }

  return size;
}

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  maxMemoryBytes: 500 * 1024 * 1024, // 500MB
  persistAcrossSessions: true,
};

/**
 * TensorStorageService
 *
 * Manages persistent storage of tensor data in IndexedDB with an in-memory
 * LRU cache for fast access. This service replaces storing Tensor4D objects
 * directly in Redux state.
 *
 * Key responsibilities:
 * - Store/retrieve tensor data from IndexedDB
 * - Maintain LRU cache for frequently accessed tensors
 * - Track storage usage and provide cleanup utilities
 * - Convert between ArrayBuffer (storage) and Tensor4D (usage)
 *
 * Usage:
 * ```typescript
 * const storage = TensorStorageService.getInstance();
 *
 * // Store a tensor
 * const ref = await storage.store('image-123', tensorData, STORES.IMAGE_TENSORS);
 *
 * // Retrieve as Tensor4D
 * const tensor = await storage.retrieveAsTensor('image-123', STORES.IMAGE_TENSORS);
 *
 * // Don't forget to dispose when done!
 * tensor?.dispose();
 * ```
 */

export class TensorStorageService {
  private static instance: TensorStorageService | null = null;

  private db: IDBPDatabase | null = null;
  private cache: LRUCache<StoredTensorData>;
  private options: CacheOptions;
  private initPromise: Promise<void> | null = null;

  private constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
    this.cache = new LRUCache<StoredTensorData>(this.options.maxMemoryBytes);
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: Partial<CacheOptions>): TensorStorageService {
    if (!TensorStorageService.instance) {
      TensorStorageService.instance = new TensorStorageService(options);
    }
    return TensorStorageService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (TensorStorageService.instance) {
      TensorStorageService.instance.close();
      TensorStorageService.instance = null;
    }
  }

  // ============================================================
  // Initialization
  // ============================================================

  /**
   * Initialize IndexedDB connection
   * Called automatically on first operation, but can be called explicitly
   */
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
        if (!db.objectStoreNames.contains(STORES.IMAGE_TENSORS)) {
          db.createObjectStore(STORES.IMAGE_TENSORS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.ANNOTATION_TENSORS)) {
          db.createObjectStore(STORES.ANNOTATION_TENSORS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: "id" });
        }
      },
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.cache.clear();
    this.initPromise = null;
  }

  // ============================================================
  // Core Storage Operations
  // ============================================================

  /**
   * Store tensor data and return a reference for Redux
   */
  async store(
    id: string,
    data: {
      buffer: ArrayBuffer;
      dtype: "float32" | "int32" | "uint8";
      shape: [number, number, number, number];
      preparedChannels?: PreparedChannelData;
      renderedSrc?: string;
    },
    storeName: StoreName,
  ): Promise<StorageResult<TensorReference>> {
    try {
      await this.init();
      const now = Date.now();
      const byteSize = calculateByteSize(data);

      const storedData: StoredTensorData = {
        id,
        buffer: data.buffer,
        dtype: data.dtype,
        shape: data.shape,
        byteSize,
        preparedChannels: data.preparedChannels,
        renderedSrc: data.renderedSrc,
        createdAt: now,
        lastAccessedAt: now,
      };

      // Store in IndexedDB
      await this.db!.put(storeName, storedData);

      // Also add to cache
      this.cache.set(id, storedData, byteSize);

      const reference: TensorReference = {
        storageId: id,
        storeName,
        shape: data.shape,
        dtype: data.dtype,
        byteSize,
        hasPreparedChannels: !!data.preparedChannels,
      };
      return { success: true, data: reference };
    } catch (error) {
      return {
        success: false,
        error: parseError(error),
      };
    }
  }
  /**
   * Store multiple tensors in a single transaction
   */
  async storeBatch(
    items: Array<{
      id: string;
      data: {
        buffer: ArrayBuffer;
        dtype: "float32" | "int32" | "uint8";
        shape: [number, number, number, number];
        preparedChannels?: PreparedChannelData;
        renderedSrc?: string;
      };
      storeName: StoreName;
    }>,
  ): Promise<StorageResult<TensorReference[]>> {
    try {
      await this.init();

      const now = Date.now();
      const references: TensorReference[] = [];

      // Group by store for efficient transactions
      const byStore = new Map<StoreName, StoredTensorData[]>();

      for (const item of items) {
        const byteSize = calculateByteSize(item.data);

        const storedData: StoredTensorData = {
          id: item.id,
          buffer: item.data.buffer,
          dtype: item.data.dtype,
          shape: item.data.shape,
          byteSize,
          preparedChannels: item.data.preparedChannels,
          renderedSrc: item.data.renderedSrc,
          createdAt: now,
          lastAccessedAt: now,
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
          shape: item.data.shape,
          dtype: item.data.dtype,
          byteSize,
          hasPreparedChannels: !!item.data.preparedChannels,
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

  /**
   * Retrieve raw stored data
   */
  async retrieve(
    id: string,
    storeName: StoreName,
  ): Promise<StorageResult<StoredTensorData>> {
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

      // Update last accessed time
      data.lastAccessedAt = Date.now();
      await this.db!.put(storeName, data);

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

  /**
   * Retrieve and reconstruct as Tensor4D
   * IMPORTANT: Caller is responsible for disposing the tensor!
   *
   * Note: TensorFlow.js doesn't have a native "uint8" dtype - it uses "int32"
   * for integer types. We store as uint8 for efficiency but reconstruct as int32.
   */
  async retrieveAsTensor(
    id: string,
    storeName: StoreName,
  ): Promise<Tensor4D | null> {
    const result = await this.retrieve(id, storeName);

    if (!result.success) {
      return null;
    }

    const { buffer, dtype, shape } = result.data;

    // Create typed array view and determine TF.js dtype
    // TF.js only supports: "float32" | "int32" | "bool" | "complex64" | "string"
    // We map our storage dtype to TF.js compatible dtype
    switch (dtype) {
      case "float32": {
        const typedArray = new Float32Array(buffer);
        return tensor4d(typedArray, shape, "float32");
      }
      case "int32": {
        const typedArray = new Int32Array(buffer);
        return tensor4d(typedArray, shape, "int32");
      }
      case "uint8": {
        // uint8 stored efficiently but reconstructed as int32 for TF.js
        const typedArray = new Uint8Array(buffer);
        return tensor4d(typedArray, shape, "int32");
      }
    }
  }

  /**
   * Retrieve only prepared channel data (without full tensor)
   */
  async retrievePreparedChannels(
    id: string,
    storeName: StoreName,
  ): Promise<PreparedChannelData | null> {
    const result = await this.retrieve(id, storeName);
    if (!result.success) return null;
    return result.data.preparedChannels ?? null;
  }

  /**
   * Delete tensor data
   */
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

  /**
   * Delete multiple tensors
   */
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

  // ============================================================
  // Update Operations
  // ============================================================

  /**
   * Update prepared channels for an existing tensor
   */
  async updatePreparedChannels(
    id: string,
    storeName: StoreName,
    preparedChannels: PreparedChannelData,
  ): Promise<StorageResult<void>> {
    try {
      const result = await this.retrieve(id, storeName);
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const byteSize = calculateByteSize({ ...result.data, preparedChannels });

      const updated: StoredTensorData = {
        ...result.data,
        preparedChannels,
        byteSize,
        lastAccessedAt: Date.now(),
      };
      await this.db!.put(storeName, updated);
      this.cache.set(id, updated, updated.byteSize);

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: parseError(error),
      };
    }
  }
  // ============================================================
  // Cache Management
  // ============================================================

  /**
   * Preload tensors into memory cache
   */
  async preload(ids: string[], storeName: StoreName): Promise<void> {
    await this.init();

    for (const id of ids) {
      if (!this.cache.has(id)) {
        await this.retrieve(id, storeName);
      }
    }
  }

  /**
   * Evict specific items from cache (not from IndexedDB)
   */
  evictFromCache(ids: string[]): void {
    for (const id of ids) {
      this.cache.delete(id);
    }
  }

  /**
   * Clear entire memory cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update cache size limit
   */
  setCacheLimit(maxBytes: number): void {
    this.options.maxMemoryBytes = maxBytes;
    this.cache.setMaxBytes(maxBytes);
  }

  // ============================================================
  // Storage Management
  // ============================================================

  /**
   * Get storage usage statistics
   */
  async getUsage(): Promise<StorageUsage> {
    await this.init();

    let totalSize = 0;
    let itemCount = 0;

    for (const storeName of [STORES.IMAGE_TENSORS, STORES.ANNOTATION_TENSORS]) {
      const tx = this.db!.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);

      let cursor = await store.openCursor();
      while (cursor) {
        totalSize += (cursor.value as StoredTensorData).byteSize;
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

  /**
   * Get all stored ids
   */
  async getStoredIds(storeName: StoreName): Promise<string[]> {
    await this.init();
    return this.db!.getAllKeys(storeName) as Promise<string[]>;
  }

  /**
   * Clear all stored data
   */
  async clearAll(): Promise<StorageResult<void>> {
    try {
      await this.init();

      for (const storeName of [
        STORES.IMAGE_TENSORS,
        STORES.ANNOTATION_TENSORS,
      ]) {
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

  /**
   * Clear all data older than specified age
   */
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
        const data = cursor.value as StoredTensorData;
        if (data.lastAccessedAt < cutoff) {
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
