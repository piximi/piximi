import type { StorageReference } from "utils/data-connector/types";
import type { Partition } from "utils/modelsV2/enums";

import type { EntityState } from "@reduxjs/toolkit";
import type { BitDepth as IJSBitDepth } from "image-js-latest";

export type BitDepth = IJSBitDepth;
export type DataArray = Uint8Array | Uint16Array;

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
export type ImageSeriesEntities = Record<string, ImageSeries>;

export type Kind = {
  id: string;
  name: string;
  unknownCategoryId: string;
};
export type KindEntities = Record<string, Kind>;

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
export type CategoryEntities = Record<string, Category>;

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
export type ImageEntities = Record<string, ImageObject>;

export type ExtendedImageObject = {
  id: string;
  name: string;
  seriesId: string;
  shape: Shape;
  /**
   * ? Include both category and categoryId for `FilterType` and `isFiltered` usage
   * ? May change if there if alternative filtering logic is implemented
   */
  categoryId: string;
  category: Category;
  activePlaneIdx: number;
  timepoint: number;
  bitDepth: BitDepth;
  partition: Partition;
  channelsRef: ExtendedChannel[];
};
export type Plane = {
  id: string;
  imageId: string;
  zIndex: number;
};
export type PlaneEntities = Record<string, Plane>;

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
export type ChannelEntities = Record<string, Channel>;

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
export type ChannelMetaEntities = Record<string, ChannelMeta>;

export type ExtendedChannel = Channel & {
  colorMap: ColorMap;
  rampMin: number;
  rampMax: number;
};
export type AnnotationVolume = {
  id: string;
  imageId: string;
  kindId: string;
  categoryId: string;
};
export type AnnotationVolumeEntities = Record<string, AnnotationVolume>;

// BBox = [x1, y1, x2, y2]
export type BBox = [number, number, number, number];
export type AnnotationObject = {
  id: string;
  planeId: string;
  imageId: string;
  volumeId: string;
  partition: Partition;
  shape: Shape;
  boundingBox: BBox;
  encodedMask: Array<number>;
  decodedMask?: DataArray;
};
export type AnnotationEntities = Record<string, AnnotationObject>;

export type ExtendedAnnotationObject = AnnotationObject & {
  kindId: string;
  /**
   * ? Include both category and categoryId for `FilterType` and `isFiltered` usage
   * ? May change if there if alternative filtering logic is implemented
   */
  categoryId: string;
  category: Category;
  channelsRef: ExtendedChannel[];
  planeIdx: number;
  imageId: string;
  imageName: string;
};
export type ExtendedAnnotationEntities = Record<
  string,
  ExtendedAnnotationObject
>;

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
};
