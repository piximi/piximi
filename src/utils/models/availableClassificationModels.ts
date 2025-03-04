import { Kind } from "store/data/types";
import { SequentialClassifier } from "./classification/AbstractClassifier/AbstractClassifier";
import { MobileNet } from "./classification/MobileNet/MobileNet";
import { SimpleCNN } from "./classification/SimpleCNN/SimpleCNN";
import { DEFAULT_KIND } from "store/data/constants";
import {
  CropSchema,
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
} from "./enums";
import { ModelInfo, ModelParams } from "store/types";
import { ClassifierEvaluationResultType } from "./types";

export const availableClassifierModels = [SimpleCNN, MobileNet];

export const DEFAULT_MODEL_PARAMS: ModelParams = {
  inputShape: {
    planes: 1,
    height: 64,
    width: 64,
    channels: 3,
  },
  optimizerSettings: {
    epochs: 10,
    batchSize: 32,
    learningRate: 0.01,
    lossFunction: LossFunction.CategoricalCrossEntropy,
    metrics: [Metric.CategoricalAccuracy],
    optimizationAlgorithm: OptimizationAlgorithm.Adam,
  },
  preprocessSettings: {
    shuffle: true,
    rescaleOptions: {
      rescale: true,
      center: false,
    },
    cropOptions: {
      numCrops: 1,
      cropSchema: CropSchema.None,
    },
    trainingPercentage: 0.75,
  },
};

export const DEFAULT_EVAL_RESULTS: ClassifierEvaluationResultType = {
  confusionMatrix: [],
  accuracy: -1,
  crossEntropy: -1,
  precision: -1,
  recall: -1,
  f1Score: -1,
};

export const DEFAULT_MODEL_INFO: ModelInfo = {
  status: ModelStatus.Uninitialized,
  params: DEFAULT_MODEL_PARAMS,
  evalResults: DEFAULT_EVAL_RESULTS,
};
export const kindClassifierModelDict: Record<
  Kind["id"],
  Array<SequentialClassifier>
> = {
  [DEFAULT_KIND]: availableClassifierModels.map((model) => new model()),
};
// prevent deleting DEFAULT_KIND
Object.defineProperty(kindClassifierModelDict, DEFAULT_KIND, {
  configurable: false,
});

export const addClassifierModels = (kindIds: Array<Kind["id"]>) => {
  for (const id of kindIds) {
    if (id in kindClassifierModelDict) {
      throw new Error(
        `Trying to add classifier models for an already existing kind id: ${id}`,
      );
    }

    kindClassifierModelDict[id] = availableClassifierModels.map(
      (model) => new model(),
    );
  }
};

export const deleteClassifierModels = (kindIds: Array<Kind["id"]>) => {
  for (const id of kindIds) {
    if (!(id in kindClassifierModelDict)) {
      throw new Error(
        `Trying to delete classifier models for an non-existant kind id: ${id}`,
      );
    }

    for (const model of kindClassifierModelDict[id]) {
      model.dispose();
    }
    try {
      delete kindClassifierModelDict[id];
    } catch {
      // do nothing; we expect this when "delete" called on DEFAULT_KIND
    }
  }
};
