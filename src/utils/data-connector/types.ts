/**
 * Raw tensor data stores in IndexedDB
 * Designed for efficient serialization (no TF.js objects)
 */
export const DB_NAME = "piximi-data";
export const DB_VERSION = 1;
import type { Channel, DType } from "store/dataV2/types";
export const STORES = {
  EXPERIMENT_DATA: "experiment-data",
  SERIES_DATA: "series-data",
  IMAGE_DATA: "image-data",
  PLANE_DATA: "plane-data",
  CHANNEL_DATA: "channel-data",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

/**
 * Reference stored in Redux instead of actual tensor
 */
export type StorageReference = {
  storageId: string;
  storeName: StoreName;
  width: number;
  height: number;
  dtype: DType;
  byteSize: number;
};
export type StoredChannelData = Omit<Channel, "storageReference"> & {
  histogram: ArrayBuffer;
  data: ArrayBuffer;
  createdAt: number;
  byteSize: number;
};

/**
 * Storage metadata for tracking usage
 */
// export type StorageMetadata = {
//   version: number;
//   totalSize: number;
//   itemCount: number;
//   lastCleanup: number;
// };

/**
 * Result of storage operation
 */
export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

/**
 * Storage usage statistics
 */
export type StorageUsage = {
  used: number; // bytes
  available: number; // bytes (estimated)
  itemCount: number;
  cacheHitRate: number; // 0-1
};

/**
 * Options for cache behavior
 */
export type CacheOptions = {
  maxMemoryBytes: number; // Default: 500MB
  persistAcrossSessions: boolean;
  useCache: boolean;
};

export type ChannelStorageInput = Omit<Channel, "storageReference"> & {
  histogram: ArrayBuffer;
  data: ArrayBuffer;
};

/**
 * Input data for storing a tensor in IndexedDB.
 * Separates the raw buffer + metadata from the storage bookkeeping
 * (timestamps, byteSize) that the service manages internally.
 */
export type StorageInput = {
  id: string;
  storeName: StoreName;
  data: ChannelStorageInput;
};

/**
 * Public contract for TensorStorageService.
 *
 * All storage operations return {@link StorageResult} to surface errors
 * without throwing. Callers pattern-match on `result.success` to handle
 * the happy / error paths.
 */
export interface IDataConnector {
  // ── Lifecycle ──────────────────────────────────────────────────────

  /**
   * Open the IndexedDB connection.
   * Called automatically on first operation but may be called explicitly
   * to fail fast during app startup.
   */
  init(): Promise<void>;

  /**
   * Close the IndexedDB connection and release all cached memory.
   * Safe to call multiple times.
   */
  close(): void;

  // ── Core Storage ───────────────────────────────────────────────────

  /**
   * Persist a single tensor and return a lightweight {@link StorageReference}
   * suitable for Redux state.
   *
   * @param id        - Unique identifier (typically the image/annotation id).
   * @param data      - Raw tensor buffer, dtype, shape, and optional extras.
   * @param storeName - Target IndexedDB object store.
   */
  store(
    id: string,
    data: ChannelStorageInput,
    storeName: StoreName,
  ): Promise<StorageResult<StorageReference>>;

  /**
   * Persist multiple tensors in a single IndexedDB transaction per store,
   * returning one {@link StorageReference} per item.
   *
   * Items targeting the same store are batched into one transaction for
   * better write performance.
   */
  storeBatch(
    items: Array<{
      id: string;
      data: ChannelStorageInput;
      storeName: StoreName;
    }>,
  ): Promise<StorageResult<StorageReference[]>>;

  // ── Retrieval ──────────────────────────────────────────────────────

  /**
   * Retrieve the raw {@link StoredChannelData} (ArrayBuffer + metadata).
   * Checks the LRU cache first, falling back to IndexedDB.
   *
   * @param id        - Storage key.
   * @param storeName - Object store to query.
   */
  retrieve(
    id: string,
    storeName: StoreName,
  ): Promise<StorageResult<StoredChannelData>>;
  /**
   * Retrieve the raw {@link StoredChannelData} (ArrayBuffer + metadata)
   * for the given items.
   * Checks the LRU cache first, falling back to IndexedDB.
   */
  retrieveBatch(
    items: { id: string; storeName: StoreName }[],
  ): Promise<StorageResult<Map<string, StoredChannelData>>>;

  // ── Deletion ───────────────────────────────────────────────────────

  /**
   * Remove a single tensor from both IndexedDB and cache.
   */
  delete(id: string, storeName: StoreName): Promise<StorageResult<void>>;

  /**
   * Remove multiple tensors in batched transactions (one per store).
   */
  deleteBatch(
    items: Array<{ id: string; storeName: StoreName }>,
  ): Promise<StorageResult<void>>;

  // ── Cache Management ───────────────────────────────────────────────

  /**
   * Eagerly load tensors into the in-memory LRU cache so that subsequent
   * reads avoid IndexedDB round-trips.
   */
  preload(ids: string[], storeName: StoreName): Promise<void>;

  /**
   * Evict specific items from the in-memory cache.
   * Data remains in IndexedDB and will be re-cached on next access.
   */
  evictFromCache(ids: string[]): void;

  /** Clear the entire in-memory cache without touching IndexedDB. */
  clearCache(): void;

  /**
   * Dynamically adjust the maximum cache size (in bytes).
   * Evicts least-recently-used entries if the new limit is smaller.
   */
  setCacheLimit(maxBytes: number): void;

  // ── Storage Management ─────────────────────────────────────────────

  /** Compute aggregate storage statistics across all tensor stores. */
  getUsage(): Promise<StorageUsage>;

  /** List every stored id in the given object store. */
  getStoredIds(storeName: StoreName): Promise<string[]>;

  /**
   * Wipe all tensor data from IndexedDB and the cache.
   * Use with caution — this is irreversible within the current session.
   */
  clearAll(): Promise<StorageResult<void>>;

  /**
   * Delete tensors whose `lastAccessedAt` is older than `maxAgeMs`
   * milliseconds ago.
   *
   * @returns The number of deleted entries on success.
   */
  clearOlderThan(
    maxAgeMs: number,
    storeName: StoreName,
  ): Promise<StorageResult<number>>;
}

// ── LRU Cache ──────────────────────────────────────────────────────────

/**
 * Snapshot of LRU cache health metrics.
 */
export type CacheStats = {
  /** Current total byte size of all cached entries. */
  size: number;
  /** Number of entries currently in the cache. */
  count: number;
  /** Ratio of cache hits to total lookups (0–1). Returns 0 when no lookups have occurred. */
  hitRate: number;
};

/**
 * Generic LRU (Least Recently Used) cache with byte-size–based eviction.
 *
 * Entries are evicted oldest-access-first when the cumulative byte size
 * exceeds the configured maximum. A single entry whose `byteSize` alone
 * exceeds the limit is silently dropped on {@link set} rather than evicting
 * the entire cache.
 *
 * @typeParam T - The type of cached values.
 */
export interface ILRUCache<T> {
  /**
   * Look up a value by key.
   * Counts as a cache hit (updates access time) when found,
   * or a cache miss when not.
   *
   * @returns The cached value, or `undefined` on a miss.
   */
  get(key: string): T | undefined;

  /**
   * Insert or replace a cache entry.
   *
   * If inserting would exceed the byte limit, least-recently-used entries
   * are evicted until there is room. If `byteSize` alone exceeds the
   * limit, the entry is silently not cached.
   *
   * @param key      - Unique cache key.
   * @param value    - The value to cache.
   * @param byteSize - Approximate memory footprint in bytes, used for eviction decisions.
   */
  set(key: string, value: T, byteSize: number): void;

  /**
   * Remove a single entry from the cache.
   *
   * @returns `true` if the entry existed and was removed, `false` otherwise.
   */
  delete(key: string): boolean;

  /** Check whether a key is present in the cache (does not count as an access). */
  has(key: string): boolean;

  /** Remove all entries and reset the current byte size to zero. */
  clear(): void;

  /** Return a snapshot of cache health metrics. */
  getStats(): CacheStats;

  /**
   * Change the maximum byte capacity at runtime.
   * If the new limit is smaller than the current usage, entries are
   * evicted immediately until the cache fits.
   */
  setMaxBytes(maxBytes: number): void;

  /**
   * Evict the single least-recently-used entry.
   * No-op when the cache is empty.
   */
  evictLRU(): void;
}
