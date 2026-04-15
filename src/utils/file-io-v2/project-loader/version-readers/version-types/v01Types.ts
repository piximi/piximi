import { BitDepth, DataArray, Shape } from "store/data/types";
import { ProjectState, SegmenterState } from "store/types";
import {
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
  Partition,
} from "utils/models/enums";
import {
  ClassifierEvaluationResultType,
  CropOptions,
  FitOptions,
  RescaleOptions,
} from "utils/models/types";
import { ColorsRaw } from "utils/types";
import { RawData } from "../../types";

// ============================================================
// V01 Piximi State
// ============================================================

export type V01PiximiState = {
  project: ProjectState;
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

export type V01PreprocessOptions = {
  shuffle: boolean;
  rescaleOptions: RescaleOptions;
  cropOptions: CropOptions;
};

export type V01ClassifierState = {
  // pre-fit state
  selectedModelIdx: number;
  inputShape: Shape;
  preprocessOptions: V01PreprocessOptions;
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

// ============================================================
// V01 Data
// ============================================================

export type V01RawImageObject = {
  activePlane: number;
  categoryId: string;
  colors: ColorsRaw;
  bitDepth: BitDepth;
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
  decodedMask?: DataArray;
  plane?: number;
  imageId: string;
};
