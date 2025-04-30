import { SequentialClassifier } from "./classification/AbstractClassifier/AbstractClassifier";
import { MobileNet } from "./classification/MobileNet/MobileNet";
import { SimpleCNN } from "./classification/SimpleCNN/SimpleCNN";
import {
  CropSchema,
  LossFunction,
  Metric,
  ModelTask,
  OptimizationAlgorithm,
} from "./enums";
import { ModelInfo } from "store/types";
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

export function addModel(model: SequentialClassifier) {
  if (Object.keys(availableClassificationModels).includes(model.name))
    throw new Error(`Model with name: '${model.name}' already exists`);

  availableClassificationModels[model.name] = model;
}

export const getDefaultModelParams = (): Pick<
  ModelInfo,
  "optimizerSettings" | "preprocessSettings"
> => ({
  optimizerSettings: {
    epochs: 10,
    batchSize: 32,
    learningRate: 0.01,
    lossFunction: LossFunction.CategoricalCrossEntropy,
    metrics: [Metric.CategoricalAccuracy],
    optimizationAlgorithm: OptimizationAlgorithm.Adam,
  },
  preprocessSettings: {
    inputShape: {
      planes: 1,
      height: 20,
      width: 20,
      channels: 1,
    },
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

export const getDefaultModelInfo = (): ModelInfo => ({
  ...getDefaultModelParams(),
  evalResults: [],
});
