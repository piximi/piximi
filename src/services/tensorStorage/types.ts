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
