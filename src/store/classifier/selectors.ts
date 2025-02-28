import { createSelector } from "@reduxjs/toolkit";

import { availableClassifierModels } from "utils/models/availableClassificationModels";

import { ModelStatus } from "utils/models/enums";

import { Shape } from "store/data/types";
import { ClassifierState } from "store/types";
import {
  ClassifierEvaluationResultType,
  CompileOptions,
  CropOptions,
  FitOptions,
  PreprocessOptions,
  RescaleOptions,
} from "utils/models/types";

export const selectClassifier = ({
  classifier,
}: {
  classifier: ClassifierState;
}): ClassifierState => {
  return classifier;
};

export const selectClassifierCompileOptions = createSelector(
  selectClassifier,
  (classifier): CompileOptions => {
    return {
      learningRate: classifier.learningRate,
      lossFunction: classifier.lossFunction,
      metrics: classifier.metrics,
      optimizationAlgorithm: classifier.optimizationAlgorithm,
    };
  }
);

export const selectClassifierPreprocessOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): PreprocessOptions => {
  return classifier.preprocessOptions;
};

export const selectClassifierRescaleOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): RescaleOptions => {
  return classifier.preprocessOptions.rescaleOptions;
};
export const selectClassifierCropOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): CropOptions => {
  return classifier.preprocessOptions.cropOptions;
};

export const selectClassifierFitOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): FitOptions => {
  return classifier.fitOptions;
};
export const selectClassifierEpochs = ({
  classifier,
}: {
  classifier: ClassifierState;
}): number => {
  return classifier.fitOptions.epochs;
};

export const selectClassifierInputShape = ({
  classifier,
}: {
  classifier: ClassifierState;
}): Shape => {
  return classifier.inputShape;
};

export const selectClassifierEvaluationResult = ({
  classifier,
}: {
  classifier: ClassifierState;
}): ClassifierEvaluationResultType => {
  return classifier.evaluationResult!;
};

export const selectClassifierShuffleOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): boolean => {
  return classifier.preprocessOptions.shuffle;
};

export const selectClassifierTrainingPercentage = ({
  classifier,
}: {
  classifier: ClassifierState;
}): number => {
  return classifier.trainingPercentage;
};

export const selectClassifierModelStatus = ({
  classifier,
}: {
  classifier: ClassifierState;
}): ModelStatus => {
  return classifier.modelStatus;
};

export const selectedIdxSelector = ({
  classifier,
}: {
  classifier: ClassifierState;
}) => classifier.selectedModelIdx;

export const selectShowClearPredictionsWarning = ({
  classifier,
}: {
  classifier: ClassifierState;
}): boolean => {
  return classifier.showClearPredictionsWarning;
};

export const selectClassifierHyperparameters = createSelector(
  selectClassifierPreprocessOptions,
  selectClassifierCompileOptions,
  selectClassifierFitOptions,
  (preprocessOptions, compileOptions, fitOptions) => {
    return {
      preprocessOptions,
      compileOptions,
      fitOptions,
    };
  }
);
