import { EntityState } from "@reduxjs/toolkit";
import {
  V02Category,
  V02Kind,
  V02RawAnnotationObject,
  V02RawImageObject,
} from "./v02Types";
import { ProjectState, SegmenterState } from "store/types";
import { Shape } from "store/data/types";
import {
  ClassifierEvaluationResultType,
  CropOptions,
  RescaleOptions,
} from "utils/models/types";
import {
  LossFunction,
  Metric,
  OptimizationAlgorithm,
} from "utils/models/enums";

// ============================================================
// V11 Piximi State
// ============================================================

export type V11PiximiState = {
  project: ProjectState;
  classifier: V11ClassifierState;
  data: {
    things: EntityState<V11RawImageObject | V11RawAnnotationObject, string>;
    categories: EntityState<V11Category, string>;
    kinds: EntityState<V11Kind, string>;
  };
  segmenter: SegmenterState;
};

// ============================================================
// V11 Classifier
// ============================================================

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

// ============================================================
// V11 Data
// ============================================================

export type V11RawImageObject = V02RawImageObject;
export type V11RawAnnotationObject = V02RawAnnotationObject;
export type V11Category = V02Category;
export type V11Kind = V02Kind;
