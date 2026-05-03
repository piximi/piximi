import type { Shape } from "store/dataV2/types";
import type { SegmenterState } from "store/types";

import type {
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
  Partition,
  CropSchema,
} from "utils/modelsV2/enums";

import type { RawData } from "../../types";

// ============================================================
// V01 Piximi State
// ============================================================

export type V01PiximiState = {
  project: V01ProjectState;
  classifier: V01ClassifierState;
  segmenter: SegmenterState;
  data: {
    images: V01RawImageObject[];
    annotations: V01RawAnnotationObject[];
    categories: V01Category[];
    annotationCategories: V01Category[];
  };
};

// ============================================================
// V01 Classifier
// ============================================================

export type V01ProjectState = {
  name: string;
  imageChannels?: number;
};

// ============================================================
// V01 Classifier
// ============================================================
export type V01RescaleOptions = {
  rescale: boolean;
  center: boolean;
};
export type V01OptimizerSettings = {
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
export type V01FitOptions = Pick<V01OptimizerSettings, "epochs" | "batchSize">;
export type V01CropOptions = {
  numCrops: number;
  cropSchema: CropSchema;
};
export type V01PreprocessOptions = {
  shuffle: boolean;
  rescaleOptions: V01RescaleOptions;
  cropOptions: V01CropOptions;
};
export type V01ClassifierEvaluationResultType = {
  confusionMatrix: number[][];
  accuracy: number;
  crossEntropy: number;
  precision: number;
  recall: number;
  f1Score: number;
};

export type V01ClassifierState = {
  // pre-fit state
  selectedModelIdx: number;
  inputShape: Shape;
  preprocessOptions: V01PreprocessOptions;
  fitOptions: V01FitOptions;

  learningRate: number;
  lossFunction: LossFunction;
  optimizationAlgorithm: OptimizationAlgorithm;
  metrics: Array<Metric>;

  trainingPercentage: number;
  // post-evaluation results
  evaluationResult: V01ClassifierEvaluationResultType;
  // status flags
  modelStatus: ModelStatus;
  showClearPredictionsWarning: boolean;
};

// ============================================================
// V01 Data
// ============================================================
type V01ColorsMeta = {
  range: { [channel: number]: [number, number] };
  visible: { [channel: number]: boolean };
};

export type V01ColorsRaw = {
  color: [number, number, number][];
} & V01ColorsMeta;
export enum V01BitDepth {
  BINARY = 1,
  UINT8 = 8,
  UINT16 = 16,
  FLOAT32 = 32,
}

export type V01DataArray =
  | Uint8Array<ArrayBufferLike>
  | Uint16Array<ArrayBufferLike>
  | Float32Array<ArrayBufferLike>;

export type V01RawImageObject = {
  activePlane: number;
  categoryId: string;
  colors: V01ColorsRaw;
  bitDepth: V01BitDepth;
  id: string;
  name: string;
  shape: Shape;
  partition: Partition;
  kind?: string;
  containing?: string[]; // The URI to be displayed on the canvas
  tensorData: RawData;
};

export type V01Category = {
  id: string;
  color: string;
  name: string;
  visible: boolean;
};

export type V01RawAnnotationObject = {
  id: string;
  categoryId: string;
  boundingBox: [number, number, number, number]; // x1, y1, x_2, y_2
  encodedMask: Array<number>;
  decodedMask?: V01DataArray;
  plane?: number;
  imageId: string;
};
