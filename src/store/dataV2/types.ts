import type { EntityState } from "@reduxjs/toolkit";
import { BitDepth, DataArray } from "image-js";
import { Partition } from "utils/models/enums";

export const STORES = {
  EXPERIMENT_DATA: "experiment-date",
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
export type Experiment = { id: string; imageSeriesIds: string[] };
export type ImageSeries = {
  id: string;
  experimentId: string;
  name: string;
  bitDepth: BitDepth;
  shape: Shape;
  imageIds: string[];
  timeSeries: boolean;
  channels: string[];
};
export type ImageObject = {
  id: string;
  name: string;
  seriesId: string;
  shape: Shape;
  categoryId: string;
  activePlane: number;
  timepoint: number;
  planeIds: string[];
  bitDepth: BitDepth;
};

export type Plane = {
  id: string;
  imageId: string;
  zIndex: number;
  channelIds: string[];
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
  annotationId: string[];
};
export type AnnotationObject = {
  id: string;
  planeId: string;
  imageId: string;
  volumeId: string;
  partition: Partition;
  kind: string;
  shape: Shape;
  bitDepth: BitDepth;
  categoryId: string;
  boundingBox: [number, number, number, number];
  encodedMask: Array<number>;
  decodedMask?: DataArray;
};

export type Track = {
  id: string;
  seriesId: string;
  trackletIds: string[];
};

export type Tracklet = {
  id: string;
  trackId: string;
  annotationIds: string[];
  parents: string[];
  children: string[];
};

export type dataV2State = {
  experiments: EntityState<Experiment, string>;
  imageSeries: EntityState<ImageSeries, string>;
  images: EntityState<ImageObject, string>;
  planes: EntityState<Plane, string>;
  channels: EntityState<Channel, string>;
  channelMetas: EntityState<ChannelMeta, string>;
  annotationVolumes: EntityState<AnnotationVolume, string>;
  annotations: EntityState<AnnotationObject, string>;
  tracks: EntityState<Track, string>;
  tracklets: EntityState<Tracklet, string>;
  activeImageId: string | undefined;
  activePlaneId: string | undefined;
  activeChannelIds: string[];
};
