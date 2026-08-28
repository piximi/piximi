import { train, losses } from "@tensorflow/tfjs";

import { seededShuffle } from "utils/arrayUtils";
import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
  Partition,
} from "utils/dl/enums";
import type { TrainingInput } from "utils/dl/types";
import { representsUnknown } from "utils/stringUtils";

import type {
  ModelInfo,
  ClassifierModelParams,
  DatasetFingerprint,
  ModelLayerData,
  OptimizerSettings,
  PreprocessSettings,
  ModelClassMap,
  ModelInfoDTO,
  Run,
} from "./types";
import type { ModelCompileArgs, LayersModel } from "@tensorflow/tfjs";

const DEFAULT_CONFIDENCE_THRESHOLD = 0.5;
const DEFAULT_TRAINING_PERCENTAGE = 0.8;

export const getDefaultModelParams = (
  channels: number = 1,
): ClassifierModelParams => ({
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
      channels: channels,
    },
    shuffle: true,
    normalizeOptions: {
      normalize: true,
      center: false,
    },
    cropOptions: {
      numCrops: 1,
      cropSchema: CropSchema.None,
    },
    trainingPercentage: DEFAULT_TRAINING_PERCENTAGE,
  },
});

export const getDefaultModelInfo = (): ModelInfo => ({
  ...getDefaultModelParams(),
  valid: true,
  confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
  runs: [],
});

export const partitionTrainingData = (items: TrainingInput[]) => {
  const inference: TrainingInput[] = [];
  const labeledTraining: TrainingInput[] = [];
  const labeledValidation: TrainingInput[] = [];
  const labeledUnassigned: TrainingInput[] = [];

  items.forEach((item) => {
    if (representsUnknown(item.categoryId)) {
      inference.push(item);
    } else {
      switch (item.partition) {
        case Partition.Unassigned:
          labeledUnassigned.push(item);
          break;
        case Partition.Training:
          labeledTraining.push(item);
          break;
        case Partition.Validation:
          labeledValidation.push(item);
          break;
        default:
      }
    }
  });
  return {
    inference,
    labeledTraining,
    labeledUnassigned,
    labeledValidation,
  };
};

export const applySplitAndShuffle = (
  labeledUnassigned: TrainingInput[],
  trainingPercentage: number,
  options: { shuffle: false } | { shuffle: true; seed: number },
) => {
  const categoryCounts = labeledUnassigned.reduce(
    (counts: Record<string, { total: number; count: number }>, input) => {
      const cat = input.categoryId;
      counts[cat] = { total: (counts[cat]?.total ?? 0) + 1, count: 0 };
      return counts;
    },
    {},
  );
  const preparedLabeledUnassigned = options.shuffle
    ? seededShuffle(labeledUnassigned, options.seed)
    : labeledUnassigned;

  const splitTrainingItems: TrainingInput[] = [];
  const splitValidationItems: TrainingInput[] = [];

  preparedLabeledUnassigned.forEach((input) => {
    const cat = input.categoryId;
    const { total, count } = categoryCounts[cat];
    if (count < Math.round(total * trainingPercentage)) {
      splitTrainingItems.push(input);
      categoryCounts[cat].count++;
    } else {
      splitValidationItems.push(input);
    }
  });

  return {
    splitTrainingItems,
    splitValidationItems,
  };
};

export const evaluateConfusionMatrix = (
  nClasses: number,
  confusionMatrix: number[][],
) => {
  let precision = 0;
  let recall = 0;
  let f1Score = 0;

  if (nClasses === 2) {
    precision =
      confusionMatrix[0][0] / (confusionMatrix[0][0] + confusionMatrix[0][1]);
    recall =
      confusionMatrix[0][0] / (confusionMatrix[0][0] + confusionMatrix[1][0]);
    f1Score = (2 * (precision * recall)) / (precision + recall);
  } else {
    const diagonal: number[] = new Array(nClasses).fill(0);
    const rowSums: number[] = new Array(nClasses).fill(0);
    const colSums: number[] = new Array(nClasses).fill(0);
    for (let i = 0; i < nClasses; i++) {
      for (let j = 0; j < nClasses; j++) {
        if (i === j) {
          diagonal[i] += confusionMatrix[i][j];
        }
        rowSums[i] += confusionMatrix[i][j];
        colSums[j] += confusionMatrix[i][j];
      }
    }

    for (let k = 0; k < nClasses; k++) {
      const classKPrecision = diagonal[k] / rowSums[k];
      const classKRecall = diagonal[k] / colSums[k];
      precision += classKPrecision;
      recall += classKRecall;
      f1Score +=
        (2 * (classKPrecision * classKRecall)) /
        (classKPrecision + classKRecall);
    }
    precision /= nClasses;
    recall /= nClasses;
    f1Score /= nClasses;
  }

  return { precision: precision, recall: recall, f1Score: f1Score };
};

export const getLayersModelSummary = (model: LayersModel): ModelLayerData[] => {
  const modelSummary: ModelLayerData[] = [];

  for (let i = 0; i < model.layers.length; i++) {
    const layer = model.layers[i];

    const outputShape = layer.outputShape;
    const parameters = layer.countParams();
    const layerName = layer.name;
    const trainable = layer.trainable;

    const layerSummary: ModelLayerData = {
      layerName,
      outputShape: String(outputShape).slice(1),
      parameters: parameters,
      trainable: String(trainable),
    };

    modelSummary.push(layerSummary);
  }
  return modelSummary;
};

export const createCompileArgs = (options: OptimizerSettings) => {
  const loss = (): ModelCompileArgs["loss"] => {
    switch (options.lossFunction) {
      case LossFunction.AbsoluteDifference: {
        return losses.absoluteDifference;
      }
      case LossFunction.CategoricalCrossEntropy: {
        // 'categoricalCrossentropy' is the string name for 'losses.softmaxCrossEntropy'
        return losses.softmaxCrossEntropy;
      }
      /*
       * Disabling CosineDistance, as it doesn't conform to typescript's own type
       * definition of it (`LossOrMetricFn` in @tensorflow/tfjs-layers/dist/types.d.ts).
       * I've filed a PR for it here:
       * https://github.com/tensorflow/tfjs/pull/6780
       */
      // case LossFunction.CosineDistance: {
      //   return losses.cosineDistance;
      // }
      case LossFunction.Hinge: {
        return losses.hingeLoss;
      }
      case LossFunction.Huber: {
        return losses.huberLoss;
      }
      case LossFunction.Log: {
        return losses.logLoss;
      }
      case LossFunction.MeanSquaredError: {
        return losses.meanSquaredError;
      }
      case LossFunction.SigmoidCrossEntropy: {
        return losses.sigmoidCrossEntropy;
      }
      default: {
        return losses.softmaxCrossEntropy;
      }
    }
  };

  const metrics = (): ModelCompileArgs["metrics"] => {
    return options.metrics.map((metric: Metric) => {
      switch (metric) {
        case Metric.BinaryAccuracy:
          return "binaryAccuracy";
        case Metric.BinaryCrossEntropy:
          return "binaryCrossentropy";
        case Metric.CategoricalAccuracy:
          return "categoricalAccuracy";
        case Metric.CategoricalCrossEntropy:
          return "categoricalCrossentropy";
        case Metric.CosineProximity:
          return "categoricalCrossentropy";
        case Metric.MeanAbsoluteError:
          return "meanAbsoluteError";
        case Metric.MeanAbsolutePercentageError:
          return "meanAbsolutePercentageError";
        case Metric.MeanSquaredError:
          return "meanSquaredError";
        case Metric.Precision:
          return "precision";
        case Metric.Recall:
          return "recall";
        case Metric.SparseCategoricalAccuracy:
          return "sparseCategoricalAccuracy";
        default:
          return "categoricalAccuracy";
      }
    });
  };

  const optimizer = (): ModelCompileArgs["optimizer"] => {
    switch (options.optimizationAlgorithm) {
      case OptimizationAlgorithm.Adadelta: {
        return train.adadelta(options.learningRate);
      }
      case OptimizationAlgorithm.Adagrad: {
        return train.adagrad(options.learningRate);
      }
      case OptimizationAlgorithm.Adam: {
        return train.adam(options.learningRate);
      }
      case OptimizationAlgorithm.Adamax: {
        return train.adamax(options.learningRate);
      }
      case OptimizationAlgorithm.RMSProp: {
        return train.rmsprop(options.learningRate);
      }
      case OptimizationAlgorithm.StochasticGradientDescent: {
        return train.sgd(options.learningRate);
      }
      default: {
        return train.sgd(options.learningRate);
      }
    }
  };

  return {
    loss: loss(),
    metrics: metrics(),
    optimizer: optimizer(),
  };
};

async function hashIds(ids: string[]): Promise<string> {
  const sorted = [...ids].sort();
  const data = new TextEncoder().encode(sorted.join("\n"));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type FingerprintInput = { id: string; categoryId: string };

export async function fingerprintDataset(
  trainingData: FingerprintInput[],
  validationData: FingerprintInput[],
): Promise<DatasetFingerprint> {
  const toDesc = (item: FingerprintInput) => `${item.id}:${item.categoryId}`;
  return {
    trainingFingerprint: await hashIds(trainingData.map(toDesc)),
    validationFingerprint: await hashIds(validationData.map(toDesc)),
  };
}

export const hashCategorySet = hashIds; // semantic alias

export function modelInfoDTOToModelInfo(
  dto: ModelInfoDTO,
  runs: Run[] = [],
): ModelInfo {
  if (!dto.optimizerSettings || !dto.preprocessingSettings) {
    throw new Error(
      `Cannot convert ModelInfoDTO "${dto.name}": missing optimizer or preprocess settings`,
    );
  }

  const classMap: ModelClassMap = dto.classes.reduce((map, cls, idx) => {
    map[idx] = cls;
    return map;
  }, {} as ModelClassMap);

  const preprocessSettings: PreprocessSettings = {
    shuffle: dto.preprocessingSettings.shuffle,
    inputShape: {
      ...dto.preprocessingSettings.inputShape,
      planes: 1, // not captured in ReducedPreprocessSettings
    },
    normalizeOptions: {
      normalize: dto.preprocessingSettings.normalize,
      center: false, // not captured in ReducedPreprocessSettings
    },
    cropOptions: {
      numCrops: dto.preprocessingSettings.numCrops,
      cropSchema: dto.preprocessingSettings.cropSchema,
    },
    trainingPercentage: DEFAULT_TRAINING_PERCENTAGE, // not captured in ReducedPreprocessSettings
  };

  return {
    classMap,
    preprocessSettings,
    optimizerSettings: dto.optimizerSettings,
    confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
    runs,
    valid: dto.modelLoaded,
    trained: dto.currentFitHistory.length > 0,
  };
}
