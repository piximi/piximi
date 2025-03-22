import { createSelector } from "@reduxjs/toolkit";
import { selectActiveKindId } from "../project/selectors";
import { selectKindClassifiers } from "./selectors";
import { ModelStatus } from "utils/models/enums";
import { KindClassifier, ModelInfo } from "store/types";
import {
  ClassifierEvaluationResultType,
  OptimizerSettings,
  CropOptions,
  FitOptions,
  PreprocessSettings,
  RescaleOptions,
} from "utils/models/types";
import { Shape } from "store/data/types";
import { availableClassificationModels } from "utils/models/availableClassificationModels";
import { getSelectedModelInfo } from "./utils";

const selectActiveClassifier = createSelector(
  selectKindClassifiers,
  selectActiveKindId,
  (classifiers, activeKindId): KindClassifier => {
    return classifiers[activeKindId];
  },
);

export const selectActiveClassifierSelectedModelNameOrArch = createSelector(
  selectActiveClassifier,
  (classifier): string | number => {
    return classifier.modelNameOrArch;
  },
);
export const selectActiveClassifierModel = createSelector(
  selectActiveClassifierSelectedModelNameOrArch,
  (selectedActiveKindModelNameOrArch) => {
    return selectedActiveKindModelNameOrArch
      ? availableClassificationModels[selectedActiveKindModelNameOrArch]
      : undefined;
  },
);
export const selectActiveClassifierModelInfoDict = createSelector(
  selectActiveClassifier,
  (classifier): Record<string, ModelInfo> => {
    return classifier.modelInfoDict;
  },
);

export const selectActiveClassifierModelInfo = createSelector(
  selectActiveClassifier,
  (classifier): ModelInfo => {
    return getSelectedModelInfo(classifier);
  },
);

export const selectActiveClassifierModelStatus = createSelector(
  selectActiveClassifierModelInfo,
  (modelInfo): ModelStatus => {
    return modelInfo.status;
  },
);

export const selectActiveClassifierHistory = createSelector(
  [selectActiveClassifierModel, (state, items: string[]) => items],
  (
    model,
    items,
  ): {
    [key: string]: number[];
  } => {
    if (!model) return {};
    const fullHistory = model.history.history;
    const selectedHistory: { [key: string]: number[] } = {};
    for (const k of items) {
      if (k === "epochs") {
        selectedHistory[k] = model.history.epochs;
      } else {
        selectedHistory[k] = fullHistory.flatMap(
          (cycleHistory) => cycleHistory[k],
        );
      }
    }
    return selectedHistory;
  },
);

export const selectActiveClassifierModelWithIdx = createSelector(
  selectActiveClassifierSelectedModelNameOrArch,
  selectActiveClassifierModel,
  (modelIdx, model) => ({
    idx: modelIdx,
    model,
  }),
);

export const selectActiveClassifierOptimizerSettings = createSelector(
  selectActiveClassifierModelInfo,
  (modelInfo): OptimizerSettings => {
    return modelInfo.params.optimizerSettings;
  },
);

export const selectActiveClassifierPreprocessOptions = createSelector(
  selectActiveClassifierModelInfo,
  (modelInfo): PreprocessSettings => {
    return modelInfo.params.preprocessSettings;
  },
);

export const selectActiveClassifierRescaleOptions = createSelector(
  selectActiveClassifierPreprocessOptions,
  (settings): RescaleOptions => {
    return settings.rescaleOptions;
  },
);
export const selectActiveClassifierCropOptions = createSelector(
  selectActiveClassifierPreprocessOptions,
  (settings): CropOptions => {
    return settings.cropOptions;
  },
);

export const selectActiveClassifierFitOptions = createSelector(
  selectActiveClassifierOptimizerSettings,
  (settings): FitOptions => {
    return {
      epochs: settings.epochs,
      batchSize: settings.batchSize,
    };
  },
);
export const selectActiveClassifierEpochs = createSelector(
  selectActiveClassifierFitOptions,
  (settings): number => {
    return settings.epochs;
  },
);

export const selectActiveClassifierInputShape = createSelector(
  selectActiveClassifierModelInfo,
  (modelInfo): Shape => {
    return modelInfo.params.inputShape;
  },
);

export const selectActiveClassifierEvaluationResult = createSelector(
  selectActiveClassifierModelInfo,
  (modelInfo): ClassifierEvaluationResultType => {
    return modelInfo.evalResults;
  },
);

export const selectActiveClassifierShuffleOptions = createSelector(
  selectActiveClassifierPreprocessOptions,
  (settings): boolean => {
    return settings.shuffle;
  },
);

export const selectActiveClassifierTrainingPercentage = createSelector(
  selectActiveClassifierPreprocessOptions,
  (settings): number => {
    return settings.trainingPercentage;
  },
);

export const selectActiveClassifierHyperparameters = createSelector(
  selectActiveClassifierPreprocessOptions,
  selectActiveClassifierOptimizerSettings,
  selectActiveClassifierFitOptions,
  (preprocessOptions, compileOptions, fitOptions) => {
    return {
      preprocessOptions,
      compileOptions,
      fitOptions,
    };
  },
);
