import { CallbackList } from "@tensorflow/tfjs";
import {
  CropSchema,
  LossFunction,
  Metric,
  ModelTask,
  OptimizationAlgorithm,
} from "./enums";
import { Kind, Shape } from "store/data/types";

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
  kind?: string;
  src?: string;
  requiredChannels?: number;
};
export type TrainingCallbacks = {
  onEpochEnd: CallbackList["onEpochEnd"];
};

export type RescaleOptions = {
  rescale: boolean;
  center: boolean;
};

export type CropOptions = {
  numCrops: number;
  cropSchema: CropSchema;
};

export type SegmenterPreprocessSettings = {
  shuffle: boolean;
  rescaleOptions: RescaleOptions; // normalization
  cropOptions: CropOptions;
};

export type PreprocessSettings = {
  shuffle: boolean;
  inputShape: Shape;
  rescaleOptions: RescaleOptions; // normalization
  cropOptions: CropOptions;
  trainingPercentage: number;
};
export type OptimizerSettings = {
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
export type SegmenterCompileSettings = {
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  optimizationAlgorithm: OptimizationAlgorithm;
};

export type FitOptions = Pick<OptimizerSettings, "epochs" | "batchSize">;

export type LoadModelArgs = {
  inputShape: Shape;
  numClasses: number;
  compileOptions: OptimizerSettings;
  preprocessOptions: PreprocessSettings;
  freeze?: boolean;
  useCustomTopLayer?: boolean;
  randomizeWeights?: boolean;
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

export type ModelData = {
  modelJson: { blob: Blob; fileName: string };
  modelWeights: { blob: Blob; fileName: string };
};
export type SerializedModels = Record<string, ModelData>;
