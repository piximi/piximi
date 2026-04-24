import type {
  BitDepth,
  DataArray,
  Shape,
  ColorMap,
  DType,
} from "store/dataV2/types";
import type { ProjectState, SegmenterState } from "store/types";

import type { Partition } from "utils/modelsV2/enums";

import type { EntityState } from "@reduxjs/toolkit";
import type {
  V11ClassifierState,
  V11KindClassifier,
  V11ModelInfo,
  V11PreprocessSettings,
} from "./v11Types";

export type V2Experiment = { id: string; name: string };

export type V2ImageSeries = {
  id: string;
  experimentId: string;
  name: string;
  bitDepth: BitDepth;
  shape: Shape;
  timeSeries: boolean;
  activeImageId: string;
};

export type V2Kind = {
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
export type V2Category = ImageCategory | AnnotationCategory;

export type V2ImageObject = {
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

export type V2Plane = {
  id: string;
  imageId: string;
  zIndex: number;
};

export type V2Channel = {
  id: string;
  planeId: string;
  channelMetaId: string;
  name: string;
  dtype: DType;
  histogram: ArrayBuffer;
  data: ArrayBuffer;
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

export type V2ChannelMeta = {
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
export type V2AnnotationVolume = {
  id: string;
  imageId: string;
  kindId: string;
  categoryId: string;
};
export type V2AnnotationObject = {
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

export type V2DataState = {
  experiment: V2Experiment;
  imageSeries: EntityState<V2ImageSeries, string>;
  images: EntityState<V2ImageObject, string>;
  planes: EntityState<V2Plane, string>;
  kinds: EntityState<V2Kind, string>;
  categories: EntityState<V2Category, string>;
  channels: EntityState<V2Channel, string>;
  channelMetas: EntityState<V2ChannelMeta, string>;
  annotationVolumes: EntityState<V2AnnotationVolume, string>;
  annotations: EntityState<V2AnnotationObject, string>;
};

export type V2NormalizeOptions = {
  normalize: boolean;
  center: boolean;
};

export type V2PreprocessSettings = Omit<
  V11PreprocessSettings,
  "rescaleOptions"
> & {
  normalizeOptions: V2NormalizeOptions;
};

// Ripple up ONLY the types that transitively contain PreprocessSettings
export type V2ModelInfo = Omit<V11ModelInfo, "preprocessSettings"> & {
  preprocessSettings: V2PreprocessSettings;
};

export type V2KindClassifier = Omit<V11KindClassifier, "modelInfoDict"> & {
  modelInfoDict: Record<string, V2ModelInfo>;
};

export type V2ClassifierState = Omit<V11ClassifierState, "kindClassifiers"> & {
  kindClassifiers: Record<string, V2KindClassifier>;
};

export type V2PiximiState = {
  project: ProjectState;
  classifier: V2ClassifierState;
  data: V2DataState;
  segmenter: SegmenterState;
};
