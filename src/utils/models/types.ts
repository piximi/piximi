import { CallbackList } from "@tensorflow/tfjs";
import {
  CropSchema,
  LossFunction,
  Metric,
  ModelTask,
  OptimizationAlgorithm,
} from "./enums";
import { Kind, Category, Shape } from "store/data/types";

export interface ModelLayerData {
  layerName: string;
  outputShape: string;
  parameters: number;
  trainable: string;
}
export type ModelArgs = {
  name: string;
  task: ModelTask;
  graph: boolean;
  pretrained: boolean;
  trainable: boolean;
  src?: string;
  requiredChannels?: number;
};
export type TrainingCallbacks = {
  onEpochEnd: CallbackList["onEpochEnd"];
};

export type FitOptions = {
  epochs: number;
  batchSize: number;
};
export type RescaleOptions = {
  rescale: boolean;
  center: boolean;
};

export type CropOptions = {
  numCrops: number;
  cropSchema: CropSchema;
};

export type PreprocessOptions = {
  shuffle: boolean;
  rescaleOptions: RescaleOptions; // normalization
  cropOptions: CropOptions;
};

export type LoadDataArgs = {
  categories: Array<Category>;
  inputShape: Shape;
  preprocessOptions: PreprocessOptions;
  fitOptions: FitOptions;
};

export type LoadModelArgs = {
  inputShape: Shape;
  numClasses: number;
  compileOptions: CompileOptions;
  freeze?: boolean;
  useCustomTopLayer?: boolean;
  randomizeWeights?: boolean;
};

export type CompileOptions = {
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  optimizationAlgorithm: OptimizationAlgorithm;
};

export type LoadInferenceDataArgs = {
  fitOptions: FitOptions;
  // if cat undefined, created from default classes
  // if defined, it should be length 1, as only a foreground class is needed
  kinds?: Array<Kind>;
};

/*
 * This is a concatenation of tfjs History objects returned by .train()
 * aross training cycles, where each cycle is every time the user presses
 * the "Fit" button (with a variable number of epochs per cycle)
 */
export type ModelHistory = {
  // [0, 1, ..., numEpochs1, 0, 1, ..., numEpochs2, ...]
  // where numEpochs1 and numEpochs2 are the number of epochs set in
  // training cycles 1 and 2
  epochs: Array<number>;
  // dict i represents training cycle i
  // in the dict, each key has an array whos length is equal to the
  // number of epochs in training cycle i
  // keys are metrics, e.g. [val_]categoricalAccuracy, [val_]loss
  history: Array<{
    [key: string]: Array<number>;
  }>;
};

export type ClassifierEvaluationResultType = {
  confusionMatrix: number[][];
  accuracy: number;
  crossEntropy: number;
  precision: number;
  recall: number;
  f1Score: number;
};

export type SegmenterEvaluationResultType = {
  pixelAccuracy: number;
  IoUScore: number;
  diceScore: number;
};
