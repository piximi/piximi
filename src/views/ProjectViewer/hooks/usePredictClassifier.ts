import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { applicationSettingsSlice } from "store/applicationSettings";
import {
  selectClassifierModel,
  selectClassifierModelInfo,
} from "store/classifier/reselectors";
import {
  selectActiveKnownCategories,
  selectActiveUnlabeledThings,
} from "store/project/reselectors";
import { AlertType } from "utils/common/enums";
import { getStackTraceFromError, logger } from "utils/common/helpers";
import { AlertState } from "utils/common/types";
import { ModelStatus } from "utils/models/enums";
import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";
import { dataSlice } from "store/data";
import { UNKNOWN_IMAGE_CATEGORY_ID } from "store/data/constants";

export const usePredictClassifier = () => {
  const dispatch = useDispatch();
  const activeUnlabeledData = useSelector(selectActiveUnlabeledThings);
  const modelInfo = useSelector(selectClassifierModelInfo);
  const activeCategories = useSelector(selectActiveKnownCategories);
  const selectedModel = useSelector(selectClassifierModel);
  const { setModelStatus } = useClassifierStatus();

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
    setModelStatus(ModelStatus.Predicting);
    console.log(
      activeUnlabeledData.findIndex(
        (thing) => thing.categoryId === UNKNOWN_IMAGE_CATEGORY_ID,
      ),
    );
    try {
      selectedModel?.loadInference(activeUnlabeledData, activeCategories);
    } catch (error) {
      handleError(error as Error, "Data Preparation Error");
    }
    const thingIds = activeUnlabeledData.map((thing) => thing.id);
    let categoryIds: string[] = [];
    logger("before predict");
    try {
      categoryIds = await selectedModel.predict(activeCategories);
      logger("after predict");
    } catch (error) {
      handleError(error as Error, "Error during prediction");
    }
    console.log(categoryIds);
    if (thingIds.length === categoryIds.length) {
      dispatch(
        dataSlice.actions.updateThings({
          updates: thingIds.map((thingId, idx) => ({
            id: thingId,
            categoryId: categoryIds[idx],
          })),
        }),
      );
    }
    setModelStatus(ModelStatus.Pending);
  }, [dispatch, handleError, activeUnlabeledData, modelInfo, selectedModel]);

  return predictClassifier;
};
