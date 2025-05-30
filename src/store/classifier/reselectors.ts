import { createSelector } from "@reduxjs/toolkit";
import { selectActiveKindId } from "../project/selectors";
import { selectKindClassifiers } from "./selectors";
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
import classifierHandler from "utils/models/classification/classifierHandler";
import { getSelectedModelInfo } from "./utils";

const selectClassifier = createSelector(
  selectKindClassifiers,
  selectActiveKindId,
  (classifiers, activeKindId): KindClassifier => {
    return classifiers[activeKindId];
  },
);

export const selectClassifierModelNameOrArch = createSelector(
  selectClassifier,
  (classifier): string | number => {
    return classifier.modelNameOrArch;
  },
);
export const selectClassifierModel = createSelector(
  selectClassifierModelNameOrArch,
  (selectedModelNameOrArch) => {
    return typeof selectedModelNameOrArch === "string"
      ? classifierHandler.getModel(selectedModelNameOrArch)
      : undefined;
  },
);

const selectEveryClassifierModelInfo = createSelector(
  selectClassifier,
  (classifier): Record<string, ModelInfo> => {
    return classifier.modelInfoDict;
  },
);

export const selectAvailibleClassifierNames = createSelector(
  selectEveryClassifierModelInfo,
  (infoDict) => Object.keys(infoDict),
);
export const selectClassifierModelInfo = createSelector(
  selectClassifier,
  (classifier): ModelInfo => {
    return getSelectedModelInfo(classifier);
  },
);

export const selectClassifierHistory = createSelector(
  [selectClassifierModel, (state, items: string[]) => items],
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

export const selectClassifierModelWithIdx = createSelector(
  selectClassifierModelNameOrArch,
  selectClassifierModel,
  (modelIdx, model) => ({
    idx: modelIdx,
    model,
  }),
);

export const selectClassifierOptimizerSettings = createSelector(
  selectClassifierModelInfo,
  (modelInfo): OptimizerSettings => {
    return modelInfo.optimizerSettings;
  },
);

const selectClassifierPreprocessOptions = createSelector(
  selectClassifierModelInfo,
  (modelInfo): PreprocessSettings => {
    return modelInfo.preprocessSettings;
  },
);

export const selectClassifierRescaleOptions = createSelector(
  selectClassifierPreprocessOptions,
  (settings): RescaleOptions => {
    return settings.rescaleOptions;
  },
);
export const selectClassifierCropOptions = createSelector(
  selectClassifierPreprocessOptions,
  (settings): CropOptions => {
    return settings.cropOptions;
  },
);

export const selectClassifierFitOptions = createSelector(
  selectClassifierOptimizerSettings,
  (settings): FitOptions => {
    return {
      epochs: settings.epochs,
      batchSize: settings.batchSize,
    };
  },
);

export const selectClassifierInputShape = createSelector(
  selectClassifierModelInfo,
  (modelInfo): Shape => {
    return modelInfo.preprocessSettings.inputShape;
  },
);

export const selectClassifierEvaluationResult = createSelector(
  selectClassifierModelInfo,
  (modelInfo): ClassifierEvaluationResultType[] => {
    return modelInfo.evalResults;
  },
);

export const selectClassifierShuffleOptions = createSelector(
  selectClassifierPreprocessOptions,
  (settings): boolean => {
    return settings.shuffle;
  },
);

export const selectClassifierTrainingPercentage = createSelector(
  selectClassifierPreprocessOptions,
  (settings): number => {
    return settings.trainingPercentage;
  },
);

export const selectClassifierHyperparameters = createSelector(
  selectClassifierPreprocessOptions,
  selectClassifierOptimizerSettings,
  selectClassifierFitOptions,
  (preprocessOptions, compileOptions, fitOptions) => {
    return {
      preprocessOptions,
      compileOptions,
      fitOptions,
    };
  },
);
