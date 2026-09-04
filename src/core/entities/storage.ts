import type { DType } from "./primatives";

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
