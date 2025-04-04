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
  ModelTask,
  OptimizationAlgorithm,
} from "./enums";
import { ModelInfo, ModelParams } from "store/types";
import { ClassifierEvaluationResultType } from "./types";
import { ClonedClassifier } from "./classification/UploadedClassifier";

export const availableClassifierArchitectures = [SimpleCNN, MobileNet];

export const availableClassificationModels: Record<
  string,
  SequentialClassifier
> = {};

export const removeModel = (modelName: string) => {
  const model = availableClassificationModels[modelName];
  if (!model) throw new Error(`Model with name "${modelName}" does not exist`);
  model.dispose();
  delete availableClassificationModels[modelName];
};

export const cloneModel = async (
  baseModel: SequentialClassifier,
  newModelName: string,
): Promise<SequentialClassifier> => {
  try {
    const modelArtifacts = await baseModel.getModelArtifacts();
    const newModel = new ClonedClassifier({
      modelArtifacts,
      name: newModelName,
      pretrained: true,
      trainable: true,
      task: ModelTask.Classification,
      graph: false,
    });
    await newModel.loadModel();
    availableClassificationModels[newModelName] = newModel;
    return newModel;
  } catch (err) {
    throw new Error(
      `Could not clone classifier: ${baseModel.name}`,
      err as Error,
    );
  }
};

export async function createNewModel(
  modelName: string,
  architecture: 0 | 1,
): Promise<SequentialClassifier> {
  try {
    const model = new availableClassifierArchitectures[architecture](modelName);
    availableClassificationModels[modelName] = model;
    return model;
  } catch (err: any) {
    throw new Error("Failed to create Model.", err as Error);
  }
}

export const getDefaultModelParams = (): ModelParams => ({
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
});

export const getDefaultEvalResults = (): ClassifierEvaluationResultType => ({
  confusionMatrix: [],
  accuracy: -1,
  crossEntropy: -1,
  precision: -1,
  recall: -1,
  f1Score: -1,
});

export const getDefaultModelInfo = (): ModelInfo => ({
  status: ModelStatus.Uninitialized,
  params: getDefaultModelParams(),
  evalResults: getDefaultEvalResults(),
});
export const kindClassifierModelDict: Record<
  Kind["id"],
  Array<SequentialClassifier>
> = {
  [DEFAULT_KIND]: availableClassifierArchitectures.map((model) => new model()),
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

    kindClassifierModelDict[id] = availableClassifierArchitectures.map(
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
