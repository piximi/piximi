import { createSelector } from "@reduxjs/toolkit";
import {
  selectActiveKindId,
  selectActiveView,
  selectActiveSelectedIds,
  selectActiveFilters,
  selectSelectedImageIds,
  selectActiveClassifierModelTarget,
} from "./selectors";

import {
  selectAllCategories,
  selectExtendedAnnotationsByKindId,
  selectExtendedImages,
} from "store/dataV2/selectors";
import { representsUnknown } from "utils/stringUtils";
import { RootState } from "store/rootReducer";
import { isFiltered } from "utils/arrayUtils";
import { selectKindClassifiers } from "store/classifierV2/selectors";
import { KindClassifier, ModelInfo } from "store/types";
import classifierHandler from "utils/models/classification/classifierHandler";
import { Partition } from "utils/models/enums";
import {
  ClassifierEvaluationResultType,
  CropOptions,
  FitOptions,
  OptimizerSettings,
  PreprocessSettings,
  RescaleOptions,
} from "utils/models/types";
import { getSelectedModelInfo } from "store/classifierV2/utils";
import { Shape } from "store/dataV2/types";

// --- Images ---

export const selectSelectedImages = createSelector(
  selectSelectedImageIds,
  selectExtendedImages,
  (selectedIds, images) => {
    const selectedSet = new Set(selectedIds);
    return images.filter((images) => selectedSet.has(images.id));
  },
);

// --- Categories ---

export const selectActiveCategories = createSelector(
  selectActiveView,
  selectActiveKindId,
  selectAllCategories,
  (view, kindId, categories) =>
    categories
      .filter((c) =>
        view === "images"
          ? c.type === "image"
          : c.type === "annotation" && c.kindId === kindId,
      )
      .sort((c) => (representsUnknown(c.id) ? -1 : 1)),
);

export const selectActiveKnownCategories = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.filter((cat) => !representsUnknown(cat.id));
  },
);
export const selectActiveUnknownCategory = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.find((cat) => representsUnknown(cat.id));
  },
);

// --- Items pipeline ---

const selectActiveExtendedAnnotations = (state: RootState) =>
  selectExtendedAnnotationsByKindId(state, selectActiveKindId(state));

export const selectActiveItems = createSelector(
  selectActiveView,
  selectActiveExtendedAnnotations,
  selectExtendedImages,
  (view, annotations, images) => {
    if (view === "images") return images;
    return annotations;
  },
);

export const selectVisibleItems = createSelector(
  selectActiveFilters,
  selectActiveItems,
  (filters, entities) => {
    return entities.filter((entity) => !isFiltered(entity, filters ?? {}));
  },
);

export const selectVisibleSelectedItems = createSelector(
  selectActiveSelectedIds,
  selectVisibleItems,
  (selectedIds, entities) => {
    const selectedSet = new Set(selectedIds);
    return entities.filter((entity) => selectedSet.has(entity.id));
  },
);

export const selectActiveSelectedItems = createSelector(
  selectActiveSelectedIds,
  selectActiveItems,
  (selectedIds, items) => {
    const selectedSet = new Set(selectedIds);
    return items.filter((items) => selectedSet.has(items.id));
  },
);

export const selectActiveLabeledItems = createSelector(
  selectActiveItems,
  (activeItems) => {
    return activeItems.filter((item) => !representsUnknown(item.categoryId));
  },
);

export const selectActiveItemsByPartition = createSelector(
  selectActiveItems,
  (_: RootState, partition: Partition) => partition,
  (activeItems, partition) => {
    return activeItems.filter((item) => item.partition === partition);
  },
);

// --- Stats ---

export const selectTotalActiveLabeledItems = createSelector(
  selectActiveLabeledItems,
  (labeledItems) => {
    return labeledItems.length;
  },
);

export const selectTotalActiveUnlabeledItems = createSelector(
  selectActiveItems,
  (activeItems) => {
    return activeItems.reduce((total: number, item) => {
      if (representsUnknown(item.categoryId)) total++;
      return total;
    }, 0);
  },
);

// -- Models --

const selectActiveClassifier = createSelector(
  selectKindClassifiers,
  selectActiveClassifierModelTarget,
  (classifiers, modelTarget): KindClassifier => {
    return classifiers[modelTarget.id];
  },
);

export const selectActiveClassifierModelNameOrArch = createSelector(
  selectActiveClassifier,
  (classifier): string | number => {
    return classifier.modelNameOrArch;
  },
);
export const selectActiveClassifierModel = createSelector(
  selectActiveClassifierModelNameOrArch,
  (selectedModelNameOrArch) => {
    return typeof selectedModelNameOrArch === "string"
      ? classifierHandler.getModel(selectedModelNameOrArch)
      : undefined;
  },
);

const selectEveryClassifierModelInfo = createSelector(
  selectActiveClassifier,
  (classifier): Record<string, ModelInfo> => {
    return classifier.modelInfoDict;
  },
);

export const selectAvailibleClassifierNames = createSelector(
  selectEveryClassifierModelInfo,
  (infoDict) => Object.keys(infoDict),
);
export const selectClassifierModelInfo = createSelector(
  selectActiveClassifier,
  (classifier): ModelInfo => {
    return getSelectedModelInfo(classifier);
  },
);

export const selectClassifierHistory = createSelector(
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

export const selectClassifierModelWithIdx = createSelector(
  selectActiveClassifierModelNameOrArch,
  selectActiveClassifierModel,
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
