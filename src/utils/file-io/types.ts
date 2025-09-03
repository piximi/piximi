import { TypeOf as IOTSTypeOf } from "io-ts";
import { DataArray, Stack as IJSStack } from "image-js";
import {
  SerializedAnnotationRType,
  V02_SerializedAnnotationRType,
  SerializedCOCOAnnotationRType,
  SerializedCOCOCategoryRType,
  SerializedCOCOFileRType,
  SerializedCOCOImageRType,
  SerializedFileRType,
  V02_SerializedFileRType,
  SerializedImageRType,
  V12_SerializedAnnotationRType,
  V12_SerializedFileRType,
} from "./runtime/runtimeTypes";
import { MIMETYPES } from "./enums";
import { ImageShapeEnum } from "./enums";
import {
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
  Partition,
} from "utils/models/enums";
import { BitDepth, Shape } from "store/data/types";
import {
  ClassifierEvaluationResultType,
  CropOptions,
  FitOptions,
  RescaleOptions,
} from "utils/models/types";
import { Colors, PartialBy, RequireField } from "utils/types";
import { Tensor4D } from "@tensorflow/tfjs";
import {
  ClassifierState,
  DataState,
  ProjectState,
  SegmenterState,
} from "store/types";
import { EntityState } from "@reduxjs/toolkit";

export type ImageShapeInfoImage = ImageFileShapeInfo & {
  fileName: string;
  image?: IJSStack;
  error?: string;
};

export type SerializedCOCOAnnotationType = IOTSTypeOf<
  typeof SerializedCOCOAnnotationRType
>;

export type SerializedCOCOCategoryType = IOTSTypeOf<
  typeof SerializedCOCOCategoryRType
>;
export type SerializedAnnotatorImageType = IOTSTypeOf<
  typeof SerializedImageRType
>;

export type SerializedCOCOImageType = IOTSTypeOf<
  typeof SerializedCOCOImageRType
>;

export type SerializedCOCOFileType = IOTSTypeOf<typeof SerializedCOCOFileRType>;

export type SerializedFileType = IOTSTypeOf<typeof SerializedFileRType>;
export type SerializedFileTypeV02 = IOTSTypeOf<typeof V02_SerializedFileRType>;
export type SerializedFileTypeV12 = IOTSTypeOf<typeof V12_SerializedFileRType>;
export type SerializedAnnotationType = IOTSTypeOf<
  typeof SerializedAnnotationRType
>;

export type V02_SerializedAnnotationType = IOTSTypeOf<
  typeof V02_SerializedAnnotationRType
>;

export type V12_SerializedAnnotationType = IOTSTypeOf<
  typeof V12_SerializedAnnotationRType
>;

export type ImageFileType = {
  fileName: string;
  imageStack: IJSStack;
};

export type ImageFileError = {
  fileName: string;
  error: string;
};

export type MIMEType = (typeof MIMETYPES)[keyof typeof MIMETYPES];

export interface ImageShapeInfo {
  shape: ImageShapeEnum;
  bitDepth?: BitDepth;
  components?: number;
  alpha?: boolean;
}

export interface ImageFileShapeInfo extends ImageShapeInfo {
  ext: MIMEType;
}

export type LoadCB = (loadPercent: number, loadMessage: string) => void;

/*
V01 Types
*/
export type V01_PreprocessOptions = {
  shuffle: boolean;
  rescaleOptions: RescaleOptions;
  cropOptions: CropOptions;
};

export type V01_ClassifierState = {
  // pre-fit state
  selectedModelIdx: number;
  inputShape: Shape;
  preprocessOptions: V01_PreprocessOptions;
  fitOptions: FitOptions;

  learningRate: number;
  lossFunction: LossFunction;
  optimizationAlgorithm: OptimizationAlgorithm;
  metrics: Array<Metric>;

  trainingPercentage: number;
  // post-evaluation results
  evaluationResult: ClassifierEvaluationResultType;
  // status flags
  modelStatus: ModelStatus;
  showClearPredictionsWarning: boolean;
};
export type V01Project = {
  project: ProjectState;
  classifier: V01_ClassifierState;
  data: {
    images: Array<V01_ImageObject>;
    annotations: Array<V01_AnnotationObject>;
    categories: Array<V01_Category>;
    annotationCategories: Array<V01_Category>;
  };
  segmenter: SegmenterState;
};
export type V01_ImageObject = {
  activePlane: number;
  categoryId: string;
  colors: Colors;
  bitDepth: BitDepth;
  id: string;
  name: string;
  shape: Shape;
  data: Tensor4D; // [Z, H, W, C]
  partition: Partition;
  src: string;
  kind?: string;
  containing?: string[]; // The URI to be displayed on the canvas
};
export type V01_Category = {
  color: string;
  id: string;
  name: string;
  visible: boolean;
  kind?: string;
};

export type V01_AnnotationObject = {
  id: string;
  src?: string;
  data?: Tensor4D;
  categoryId: string;
  boundingBox: [number, number, number, number]; // x1, y1, x_2, y_2
  encodedMask: Array<number>;
  decodedMask?: DataArray;
  plane?: number;
  imageId: string;
  // TODO serialize: these should not be undefineable
};

// V02 Types

export type V02ClassifierState = V01_ClassifierState;
export type V02Kind = {
  id: string;
  displayName: string;
  unknownCategoryId: string;
  containing: string[];
  categories: string[];
};
export type V02Category = RequireField<V01_Category, "kind"> & {
  containing: string[];
};
export type V02AnnotationObject = Required<
  Omit<V01_AnnotationObject, "decodedMask">
> & {
  kind: string;
  name: string;
  bitDepth: BitDepth;
  shape: Shape;
  partition: Partition;
  decodedMask?: DataArray;
  activePlane: number;
};
export type V02ImageObject = Required<V01_ImageObject>;

export type V02Project = {
  project: ProjectState;
  classifier: V01_ClassifierState;
  data: {
    things: EntityState<V02ImageObject | V02AnnotationObject, string>;
    categories: EntityState<V02Category, string>;
    kinds: EntityState<V02Kind, string>;
  };
  segmenter: SegmenterState;
};

export type V02DataState = {
  kinds: EntityState<V02Kind, string>;
  categories: EntityState<V02Category, string>;
  things: EntityState<V02AnnotationObject | V02ImageObject, string>;
};

// V11 Types

export type V11ImageObject = V02ImageObject;
export type V11AnnotationObject = V02AnnotationObject;
export type V11Category = V02Category;
export type V11Kind = V02Kind;

export type V11DataState = {
  things: EntityState<V11ImageObject | V11AnnotationObject, string>;
  categories: EntityState<V11Category, string>;
  kinds: EntityState<V11Kind, string>;
};

export type V11PreprocessSettings = {
  shuffle: boolean;
  inputShape: Shape;
  rescaleOptions: RescaleOptions; // normalization
  cropOptions: CropOptions;
  trainingPercentage: number;
};
export type V11OptimizerSettings = {
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  optimizationAlgorithm: OptimizationAlgorithm;
  epochs: number;
  batchSize: number;
};
export type V11ModelClassMap = Record<number, V11Category["id"]>;
export type V11ModelInfo = {
  trainingSet?: string[];
  validationDet?: string[];
  classMap?: V11ModelClassMap;
  preprocessSettings: V11PreprocessSettings;
  optimizerSettings: V11OptimizerSettings;
  evalResults: ClassifierEvaluationResultType[];
};
export type V11KindClassifier = {
  modelNameOrArch: string | number;
  modelInfoDict: Record<string, V11ModelInfo>;
};
export type V11KindClassifierDict = Record<V11Kind["id"], V11KindClassifier>;
export type V11ClassifierState = {
  kindClassifiers: V11KindClassifierDict;
  showClearPredictionsWarning: boolean;
};

export type V11Project = {
  project: ProjectState;
  classifier: V11ClassifierState;
  data: {
    things: EntityState<V11ImageObject | V11AnnotationObject, string>;
    categories: EntityState<V11Category, string>;
    kinds: EntityState<V11Kind, string>;
  };
  segmenter: SegmenterState;
};

// V12 Types
export type V12Category = Omit<V11Category, "containing">;
export type V12Kind = Omit<V11Kind, "categories" | "containing">;
export type V12AnnotationObject = PartialBy<
  V11AnnotationObject,
  "activePlane"
> & {
  timepoint: number;
  childIds?: string[];
};
export type V12ImageData = {
  id: string;
  name: string;
  metadataId: string;
  colors: Colors;
  src: string;
  data: Tensor4D;
  categoryId: string;
  activePlane: number;
  partition: Partition;
  timepoint?: number;
};

export type V12BaseExtractedImageData = {
  id: string;
  bitDepth: number;
  shape: Shape;
  colors: Colors;
  data: Tensor4D;
  src: string;
};
export type V12ImageMetadata = {
  id: string;
  name: string;
  kind: string;
  bitDepth: BitDepth;
  shape: Shape;
  timeSeries: boolean;
  imageDataIds: string[];
  defaultImageId: string;
};

export type V12GeneralizedKindItem = {
  id: string;
  name: string;
  categoryId: string;
  selected?: boolean; // UI state for bulk operations
  kind: string;

  // Spatial/display info (common to both)
  boundingBox?: [number, number, number, number];
  plane?: number;
  activePlane: number;

  // Time series info
  timepoint?: number;

  // Visual representation
  src: string;
  colors?: Colors;
  data: Tensor4D;

  // Metadata for operations
  metadataId?: string;
  shape: Shape;
  bitDepth: BitDepth;
  partition: Partition;

  // Optional fields that might only apply to one type
  childIds?: string[]; // for annotations with hierarchical relationships
  containing?: string[]; // for images

  // For displaying timeseries
  grouped?: boolean;
};

export type V12Project = {
  project: ProjectState;
  classifier: ClassifierState;
  data: DataState;
  segmenter: SegmenterState;
};
