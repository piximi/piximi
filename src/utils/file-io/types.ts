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
import {
  TSAnnotationObject,
  BitDepth,
  Category,
  TSImageObject,
  Kind,
  Shape,
  ImageObject,
  AnnotationObject,
} from "store/data/types";
import {
  ClassifierEvaluationResultType,
  CropOptions,
  FitOptions,
  RescaleOptions,
} from "utils/models/types";
import { Colors, PartialBy } from "utils/types";
import { Tensor4D } from "@tensorflow/tfjs";
import { ClassifierState, ProjectState, SegmenterState } from "store/types";
import { EntityState } from "@reduxjs/toolkit";

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
export type SerializedAnnotationType = IOTSTypeOf<
  typeof SerializedAnnotationRType
>;

export type V02_SerializedAnnotationType = IOTSTypeOf<
  typeof V02_SerializedAnnotationRType
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
OLD TYPES
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
export type V01_Category = PartialBy<Category, "containing" | "kind">;

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
    categories: EntityState<Category, string>;
    kinds: EntityState<Kind, string>;
  };
  segmenter: SegmenterState;
};

export type V11ImageObject = V02ImageObject;
export type V11AnnotationObject = V02AnnotationObject;

export type V11Project = {
  project: ProjectState;
  classifier: ClassifierState;
  data: {
    things: EntityState<V11ImageObject | V11AnnotationObject, string>;
    categories: EntityState<Category, string>;
    kinds: EntityState<Kind, string>;
  };
  segmenter: SegmenterState;
};

export type CurrentProject = {
  project: ProjectState;
  classifier: ClassifierState;
  data: {
    things: EntityState<ImageObject | AnnotationObject, string>;
    images: EntityState<TSImageObject, string>;
    annotations: EntityState<TSAnnotationObject, string>;
    categories: EntityState<Category, string>;
    kinds: EntityState<Kind, string>;
  };
  segmenter: SegmenterState;
};
