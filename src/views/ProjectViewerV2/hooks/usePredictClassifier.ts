import React, { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { dataSliceV2 } from "store/dataV2";
import { classifierSlice } from "store/classifierV2";
import {
  selectActiveClassifierModel,
  selectActiveClassifierModelNameOrArch,
  selectActiveItems,
  selectActiveKnownCategories,
  selectClassifierModelInfo,
} from "@ProjectViewer/state/reselectors";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useClassMapDialog } from "@ProjectViewer/contexts/class-map";
import { IMAGE_CLASSIFIER_ID } from "store/dataV2/constants";

import { logger } from "utils/logUtils";
import { representsUnknown } from "utils/stringUtils";
import classifierHandler from "utils/modelsV2/classification/classifierHandler";
import { toInferenceInput } from "utils/modelsV2/utils";
import { ModelStatus } from "utils/modelsV2/enums";

import { useClassifierHistory } from "../contexts/ClassifierHistoryProvider";
import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";
import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

export const usePredictClassifier = () => {
  const dispatch = useDispatch();
  const activeItems = useSelector(selectActiveItems);
  const modelInfo = useSelector(selectClassifierModelInfo);
  const activeCategories = useSelector(selectActiveKnownCategories);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const modelNameOrArch = useSelector(selectActiveClassifierModelNameOrArch);
  const selectedModel = useSelector(selectActiveClassifierModel);
  const { setModelStatus } = useClassifierStatus();
  const { setPredictedProbabilities } = useClassifierHistory();
  const { getClassMap } = useClassMapDialog();

  const handleError = useClassifierErrorHandler();

  const predictClassifier = useCallback(async () => {
    if (typeof modelNameOrArch !== "string" || !selectedModel) {
      handleError(
        new Error(
          "Cannot predict: no trained classifier is selected for this kind.",
        ),
        "Prediction Error",
      );
      return;
    }
    const modelName = modelNameOrArch;

    let classMap = modelInfo.classMap;
    if (!classMap) {
      if (!selectedModel.classes) return;
      const setMapping = await getClassMap({
        projectCategories: activeCategories,
        modelClasses: selectedModel.classes,
      });
      if (!setMapping) return;
      classMap = setMapping;
      dispatch(
        classifierSlice.actions.addModelClassMapping({
          kindId: modelTarget.id,
          modelName,
          classMapping: classMap,
        }),
      );
    }

    const unlabeledItems = activeItems.filter((item) =>
      representsUnknown(item.categoryId),
    );

    setModelStatus(ModelStatus.Predicting);

    try {
      classifierHandler.loadInference(
        modelName,
        unlabeledItems.map(toInferenceInput),
        [],
      );
    } catch (error) {
      handleError(error as Error, "Data Preparation Error");
      return;
    }

    const itemIds = unlabeledItems.map((item) => item.id);
    let results: { categoryIds: string[]; probabilities: number[] } = {
      categoryIds: [],
      probabilities: [],
    };
    logger("before predict");
    try {
      results = await classifierHandler.predict(
        modelName,
        Object.values(classMap).map((id) => ({ id })),
      );
      logger("after predict");
    } catch (error) {
      handleError(error as Error, "Error during prediction");
      return;
    }

    const probabilitiesById: Record<string, number> = {};
    if (itemIds.length === results.categoryIds.length) {
      const updates = itemIds.map((id, idx) => {
        probabilitiesById[id] = results.probabilities[idx];
        return { id, categoryId: results.categoryIds[idx] };
      });
      if (modelTarget.id === IMAGE_CLASSIFIER_ID) {
        dispatch(dataSliceV2.actions.batchUpdateImageCategory(updates));
      } else {
        // Annotation predictions map to their volume's category.
        const volumeUpdates = unlabeledItems.reduce<
          Array<{ volumeId: string; categoryId: string }>
        >((acc, item, idx) => {
          const volumeId = (item as { volumeId?: string }).volumeId;
          if (volumeId) {
            acc.push({ volumeId, categoryId: results.categoryIds[idx] });
          }
          return acc;
        }, []);
        dispatch(
          dataSliceV2.actions.batchUpdateAnnotationVolumeCategory(
            volumeUpdates,
          ),
        );
      }
    }
    setPredictedProbabilities(probabilitiesById);
    setModelStatus(ModelStatus.Pending);
  }, [
    dispatch,
    handleError,
    activeItems,
    activeCategories,
    modelTarget,
    modelInfo,
    modelNameOrArch,
    selectedModel,
    getClassMap,
    setModelStatus,
    setPredictedProbabilities,
  ]);

  return predictClassifier;
};
