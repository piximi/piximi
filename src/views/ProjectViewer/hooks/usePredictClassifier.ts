import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { applicationSettingsSlice } from "store/applicationSettings";
import { dataSlice } from "store/data";
import {
  selectClassifierModel,
  selectClassifierModelInfo,
} from "store/classifier/reselectors";
import {
  selectActiveKnownCategories,
  selectActiveUnlabeledThings,
} from "store/project/reselectors";
import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";
import { useClassifierHistory } from "../contexts/ClassifierHistoryProvider";

import { getStackTraceFromError, logger } from "utils/common/logUtils";
import { AlertType } from "utils/common/enums";
import { ModelStatus } from "utils/models/enums";
import { AlertState } from "utils/common/types";
import { useClassMapDialog } from "./useClassMapDialog";
import { classifierSlice } from "store/classifier";
import { selectActiveKindId } from "store/project/selectors";

export const usePredictClassifier = () => {
  const dispatch = useDispatch();
  const activeUnlabeledData = useSelector(selectActiveUnlabeledThings);
  const modelInfo = useSelector(selectClassifierModelInfo);
  const activeCategories = useSelector(selectActiveKnownCategories);
  const activeKindId = useSelector(selectActiveKindId);
  const selectedModel = useSelector(selectClassifierModel);
  const { setModelStatus } = useClassifierStatus();
  const { setPredictedProbabilities } = useClassifierHistory();
  const { getClassMap } = useClassMapDialog();

  const handleError = useCallback(
    async (error: Error, name: string) => {
      const stackTrace = await getStackTraceFromError(error);
      const alertState: AlertState = {
        alertType: AlertType.Error,
        name: name,
        description: `${error.name}:\n${error.message}`,
        stackTrace: stackTrace,
      };
      if (import.meta.env.NODE_ENV !== "production") {
        console.error(
          alertState.name,
          "\n",
          alertState.description,
          "\n",
          alertState.stackTrace,
        );
      }
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: alertState,
        }),
      );
      setModelStatus(ModelStatus.Idle);
    },
    [dispatch],
  );

  const predictClassifier = useCallback(async () => {
    if (!selectedModel) return;

    let classMap = modelInfo.classMap;

    if (!classMap) {
      if (!selectedModel.classes) return;
      const setMapping = await getClassMap({
        projectCategories: activeCategories,
        modelClasses: selectedModel.classes,
      });
      if (!setMapping) {
        return;
      }
      classMap = setMapping;
      dispatch(
        classifierSlice.actions.addModelClassMapping({
          kindId: activeKindId,
          modelName: selectedModel.name,
          classMapping: classMap,
        }),
      );
    }

    setModelStatus(ModelStatus.Predicting);

    try {
      selectedModel.loadInference(activeUnlabeledData, []);
    } catch (error) {
      handleError(error as Error, "Data Preparation Error");
    }
    const thingIds = activeUnlabeledData.map((thing) => thing.id);
    let results: { categoryIds: string[]; probabilities: number[] } = {
      categoryIds: [],
      probabilities: [],
    };
    logger("before predict");
    try {
      results = await selectedModel.predict(
        Object.values(classMap).map((id) => ({
          id,
        })),
      );
      logger("after predict");
    } catch (error) {
      handleError(error as Error, "Error during prediction");
    }
    const dataCatProbs: Record<string, number> = {};
    if (thingIds.length === results.categoryIds.length) {
      dispatch(
        dataSlice.actions.updateThings({
          updates: thingIds.map((thingId, idx) => {
            dataCatProbs[thingId] = results.probabilities[idx];
            return {
              id: thingId,
              categoryId: results.categoryIds[idx],
            };
          }),
        }),
      );
    }
    setPredictedProbabilities(dataCatProbs);
    setModelStatus(ModelStatus.Pending);
  }, [dispatch, handleError, activeUnlabeledData, modelInfo, selectedModel]);

  return predictClassifier;
};
