import React, { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { dataSliceV2 } from "store/dataV2";
import { classifierSlice } from "store/classifier";
import {
  selectActiveItems,
  selectActiveKnownCategories,
} from "@ProjectViewer/state/reselectors";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useClassMapDialog } from "@ProjectViewer/contexts/class-map";
import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";

import { logger } from "utils/logUtils";
import { representsUnknown } from "utils/stringUtils";
import classifierHandler from "utils/dl/classification/classifierHandler";
import { toInferenceInput } from "utils/dl/utils";
import type { PredictionResult } from "utils/dl/classification/types";

import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

export const usePredictClassifier = () => {
  const dispatch = useDispatch();
  const activeItems = useSelector(selectActiveItems);
  const activeCategories = useSelector(selectActiveKnownCategories);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget,
  );

  const { getClassMap } = useClassMapDialog();

  const handleError = useClassifierErrorHandler();

  const predictClassifier = useCallback(async () => {
    if (!kindClassifier || !kindClassifier.activeModel) return;
    const modelTargetId = kindClassifier.modelTargetId;
    const modelName = kindClassifier.activeModel;
    const model = classifierHandler.getModel(modelName);
    const modelInfo = kindClassifier.modelInfoDict[modelName];
    const activeRun = modelInfo.runs.at(-1);

    if (!model) {
      handleError(
        new Error(
          "Cannot predict: no trained classifier is selected for this kind.",
        ),
        "Prediction Error",
      );
      return;
    }

    let classMap = modelInfo.classMap;
    if (!classMap) {
      if (!model.classes) return;
      const setMapping = await getClassMap({
        projectCategories: activeCategories,
        modelClasses: model.classes,
      });
      if (!setMapping) return;
      classMap = setMapping;
      dispatch(
        classifierSlice.actions.addModelClassMapping({
          targetId: modelTargetId,
          modelName,
          classMapping: classMap,
        }),
      );
    }

    const unlabeledItems = activeItems.filter((item) =>
      representsUnknown(item.categoryId),
    );

    dispatch(
      classifierSlice.actions.setModelStatus({
        targetId: kindClassifier.modelTargetId,
        status: "predicting",
      }),
    );

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
    let results: PredictionResult;
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

    const updates = itemIds.map((id, idx) => ({
      id,
      categoryId: results[idx].categoryId,
      predicted: {
        predictionConfidence: results[idx].maxProb,
        predictedAtRunId: activeRun!.id,
      },
    }));
    if (modelTarget === IMAGE_CLASSIFIER_ID) {
      dispatch(dataSliceV2.actions.batchUpdateImageCategory(updates));
    } else {
      dispatch(
        dataSliceV2.actions.batchBubbleUpdateAnnotationCategory(updates),
      );
    }

    // Stash full softmax map in context (volatile)
    const softmaxMap: Record<string, number[]> = {};
    itemIds.forEach((id, i) => {
      softmaxMap[id] = results[i].softmax;
    });
    dispatch(
      classifierSlice.actions.setActiveSoftmax({
        targetId: modelTarget,
        softmax: softmaxMap,
      }),
    );

    dispatch(
      classifierSlice.actions.setModelStatus({
        targetId: kindClassifier.modelTargetId,
        status: "waiting",
      }),
    );
  }, [
    dispatch,
    handleError,
    activeItems,
    activeCategories,
    kindClassifier,
    getClassMap,
  ]);

  return predictClassifier;
};
