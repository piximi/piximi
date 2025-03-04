import { TypeOf as IOTSTypeOf } from "io-ts";
import {
  Stack as IJSStack,
  BitDepth as IJSBitDepth,
  DataArray as IJSDataArray,
} from "image-js";
import {
  SerializedAnnotationRType,
  SerializedAnnotationRTypeV02,
  SerializedCOCOAnnotationRType,
  SerializedCOCOCategoryRType,
  SerializedCOCOFileRType,
  SerializedCOCOImageRType,
  SerializedFileRType,
  SerializedFileRTypeV02,
  SerializedImageRType,
} from "./runtimeTypes";
import { MIMETYPES } from "./constants";
import { ImageShapeEnum } from "./enums";
import {
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
} from "utils/models/enums";
import { Shape } from "store/data/types";
import {
  ClassifierEvaluationResultType,
  CropOptions,
  FitOptions,
  RescaleOptions,
} from "utils/models/types";

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
export type SerializedFileTypeV02 = IOTSTypeOf<typeof SerializedFileRTypeV02>;
export type SerializedAnnotationType = IOTSTypeOf<
  typeof SerializedAnnotationRType
>;

export type NewSerializedAnnotationType = IOTSTypeOf<
  typeof SerializedAnnotationRTypeV02
>;

export type ImageFileType = {
  fileName: string;
  imageStack: IJSStack;
};

export type ImageFileError = {
  fileName: string;
  error: string;
};

export type MIMEType = (typeof MIMETYPES)[number];

export type BitDepth = IJSBitDepth;

export type DataArray = IJSDataArray;

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

export type PreprocessOptionsV01_02 = {
  shuffle: boolean;
  rescaleOptions: RescaleOptions;
  cropOptions: CropOptions;
};

export type ClassifierStateV01_02 = {
  // pre-fit state
  selectedModelIdx: number;
  inputShape: Shape;
  preprocessOptions: PreprocessOptionsV01_02;
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
