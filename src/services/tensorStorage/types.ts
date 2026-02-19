export const DB_NAME = "piximi-tensors";
export const DB_VERSION = 1;

export const STORES = {
  IMAGE_TENSORS: "image-tensors",
  ANNOTATION_TENSORS: "annotation-tensors",
  METADATA: "storage-metadata",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

/**
 * Raw tensor data stores in IndexedDB
 * Designed for efficient serialization (no TF.js objects)
 */

export type StoredTensorData = {
  id: string;
  //Raw pixel data as ArrayBuffer (efficient for IndexedDB)
  buffer: ArrayBuffer;

  // Tensor metadata for reconstructions
  dtype: "float32" | "int32" | "uint8";
  shape: [number, number, number, number]; // [Z, H, W, C]

  // Byte size for cache management
  byteSize: number;
  // Prepared channel data (if available)
  preparedChannels?: PreparedChannelData;
  // Rendered preview as data URL (optional, can be regenerated)
  renderedSrc?: string;

  // Timestamps for cache management
  createdAt: number;
  lastAccessedAt: number;
};

/**
 * Prepared channel data for measurements
 */
export type PreparedChannelData = {
  //Channel data as nested arrays (not tensors - those are disposed after prep)
  // Outer array: channels, Inner array: pixel values
  data: number[][];
  // Optional: histograms per channel (256 bins)
  histograms?: number[][];
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
 * Reference stored in Redux instead of actual tensor
 */
export type TensorReference = {
  storageId: string;
  storeName: StoreName;
  shape: [number, number, number, number];
  dtype: "float32" | "int32" | "uint8";
  byteSize: number;
  hasPreparedChannels: boolean;
};

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
};

/**
 * Input data for storing a tensor in IndexedDB.
 * Separates the raw buffer + metadata from the storage bookkeeping
 * (timestamps, byteSize) that the service manages internally.
 */
export type StoreTensorInput = {
  buffer: ArrayBuffer;
  dtype: "float32" | "int32" | "uint8";
  shape: [number, number, number, number];
  preparedChannels?: PreparedChannelData;
  renderedSrc?: string;
};

/**
 * Public contract for TensorStorageService.
 *
 * All storage operations return {@link StorageResult} to surface errors
 * without throwing. Callers pattern-match on `result.success` to handle
 * the happy / error paths.
 */
export interface ITensorStorageService {
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
   * Persist a single tensor and return a lightweight {@link TensorReference}
   * suitable for Redux state.
   *
   * @param id        - Unique identifier (typically the image/annotation id).
   * @param data      - Raw tensor buffer, dtype, shape, and optional extras.
   * @param storeName - Target IndexedDB object store.
   */
  store(
    id: string,
    data: StoreTensorInput,
    storeName: StoreName,
  ): Promise<StorageResult<TensorReference>>;

  /**
   * Persist multiple tensors in a single IndexedDB transaction per store,
   * returning one {@link TensorReference} per item.
   *
   * Items targeting the same store are batched into one transaction for
   * better write performance.
   */
  storeBatch(
    items: Array<{
      id: string;
      data: StoreTensorInput;
      storeName: StoreName;
    }>,
  ): Promise<StorageResult<TensorReference[]>>;

  // ── Retrieval ──────────────────────────────────────────────────────

  /**
   * Retrieve the raw {@link StoredTensorData} (ArrayBuffer + metadata).
   * Checks the LRU cache first, falling back to IndexedDB.
   *
   * @param id        - Storage key.
   * @param storeName - Object store to query.
   */
  retrieve(
    id: string,
    storeName: StoreName,
  ): Promise<StorageResult<StoredTensorData>>;
  /**
   * Retrieve the raw {@link StoredTensorData} (ArrayBuffer + metadata)
   * for the given items.
   * Checks the LRU cache first, falling back to IndexedDB.
   */
  retrieveBatch(
    items: { id: string; storeName: StoreName }[],
  ): Promise<StorageResult<Map<string, StoredTensorData>>>;

  /**
   * Retrieve and reconstruct a TensorFlow.js `Tensor4D`.
   *
   * **IMPORTANT -- Caller owns the returned tensor and must call `.dispose()` when done.**
   *
   * Returns `null` when the id is not found.
   *
   * @param id        - Storage key.
   * @param storeName - Object store to query.
   */
  retrieveAsTensor(
    id: string,
    storeName: StoreName,
  ): Promise<import("@tensorflow/tfjs").Tensor4D | null>;

  /**
   * Retrieve only the prepared channel data (pixel arrays & histograms)
   * without reconstructing the full tensor.
   *
   * Returns `null` when the id is not found or channels were never stored.
   */
  retrievePreparedChannels(
    id: string,
    storeName: StoreName,
  ): Promise<PreparedChannelData | null>;

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

  // ── Mutation ────────────────────────────────────────────────────────

  /**
   * Attach or replace the {@link PreparedChannelData} for an existing tensor.
   * Recalculates `byteSize` after the update.
   *
   * Fails with an error result if the tensor does not exist.
   */
  updatePreparedChannels(
    id: string,
    storeName: StoreName,
    preparedChannels: PreparedChannelData,
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
