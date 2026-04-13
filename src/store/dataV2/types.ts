import type { EntityState } from "@reduxjs/toolkit";
import type { BitDepth, DataArray } from "image-js";
import { Partition } from "utils/models/enums";

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

export const DTYPES = {
  UINT8: "uint8",
  INT32: "int32",
  FLOAT32: "float32",
} as const;

export type DType = (typeof DTYPES)[keyof typeof DTYPES];

export type Shape = {
  planes: number;
  height: number;
  width: number;
  channels: number;
};

export type ColorMap = [number, number, number];

// ######################

export type Experiment = { id: string; name: string };

export type ImageSeries = {
  id: string;
  experimentId: string;
  name: string;
  bitDepth: BitDepth;
  shape: Shape;
  timeSeries: boolean;
  activeImageId: string;
};

export type Kind = {
  id: string;
  name: string;
  unknownCategoryId: string;
};

type BaseCategory = {
  id: string;
  color: string;
  name: string;
  isUnknown: boolean;
};
export type ImageCategory = BaseCategory & { type: "image" };
export type AnnotationCategory = BaseCategory & {
  type: "annotation";
  kindId: string;
};
export type Category = ImageCategory | AnnotationCategory;

export type ImageObject = {
  id: string;
  name: string;
  seriesId: string;
  shape: Shape;
  categoryId: string;
  activePlaneId: string;
  timepoint: number;
  bitDepth: BitDepth;
  partition: Partition;
};

export type Plane = {
  id: string;
  imageId: string;
  zIndex: number;
};

export type Channel = {
  id: string;
  planeId: string;
  channelMetaId: string;
  name: string;
  dtype: DType;
  storageReference: StorageReference;
  bitDepth: BitDepth;
  width: number;
  height: number;
  maxValue: number;
  minValue: number;
  total?: number;
  mean?: number;
  median?: number;
  std?: number;
  mad?: number;
  lowerQuartile?: number;
  upperQuartile?: number;
};

export type ChannelMeta = {
  id: string;
  name: string;
  seriesId: string;
  bitDepth: BitDepth;
  colorMap: ColorMap;
  visible: boolean;
  minValue: number;
  maxValue: number;
  rampMin: number;
  rampMax: number;
  rampMinLimit: number;
  rampMaxLimit: number;
};
export type AnnotationVolume = {
  id: string;
  imageId: string;
  kindId: string;
  categoryId: string;
};
export type AnnotationObject = {
  id: string;
  planeId: string;
  imageId: string;
  volumeId: string;
  partition: Partition;
  shape: Shape;
  boundingBox: [number, number, number, number];
  encodedMask: Array<number>;
  decodedMask?: DataArray;
};

export type DataRelationships = {
  imageSeries: Record<string, { imageIds: string[]; channelMetaIds: string[] }>;
  images: Record<string, { planeIds: string[]; annotationVolumeIds: string[] }>;
  imageCategories: Record<string, { imageIds: string[] }>;
  annotationCategories: Record<string, { annotationVolumeIds: string[] }>;
  kinds: Record<
    string,
    { annotationVolumeIds: string[]; categoryIds: string[] }
  >;
  planes: Record<string, { channelIds: string[]; annotationIds: string[] }>;
  channelMetas: Record<string, { channelIds: string[] }>;
  annotationVolumes: Record<string, { annotationIds: string[] }>;
};

export type DataStateV2 = {
  experiment: Experiment;
  imageSeries: EntityState<ImageSeries, string>;
  images: EntityState<ImageObject, string>;
  planes: EntityState<Plane, string>;
  kinds: EntityState<Kind, string>;
  categories: EntityState<Category, string>;
  channels: EntityState<Channel, string>;
  channelMetas: EntityState<ChannelMeta, string>;
  annotationVolumes: EntityState<AnnotationVolume, string>;
  annotations: EntityState<AnnotationObject, string>;
  relationships: DataRelationships;
};
