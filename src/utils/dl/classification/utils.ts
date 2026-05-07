import { shuffle, take, takeRight } from "lodash";

import type { ModelInfo } from "store/classifier/types";

import {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
  Partition,
} from "utils/dl/enums";
import type { ClassifierModelParams, TrainingInput } from "utils/dl/types";
import { representsUnknown } from "utils/stringUtils";

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
    trainingPercentage: 0.75,
  },
});

export const getDefaultModelInfo = (): ModelInfo => ({
  ...getDefaultModelParams(),
  valid: true,
  confidenceThreshold: 0.5,
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
  shuffleData: boolean,
) => {
  const numTrainingItems = Math.round(
    trainingPercentage * labeledUnassigned.length,
  );
  const numValidationItems = labeledUnassigned.length - numTrainingItems;

  const preparedLabeledUnassigned = shuffleData
    ? shuffle(labeledUnassigned)
    : labeledUnassigned;

  const splitTrainingItems = take(preparedLabeledUnassigned, numTrainingItems);
  const splitValidationItems = takeRight(
    preparedLabeledUnassigned,
    numValidationItems,
  );
  return {
    splitTrainingItems,
    splitValidationItems,
  };
};
