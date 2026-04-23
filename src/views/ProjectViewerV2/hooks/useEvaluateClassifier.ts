import React, { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { applicationSettingsSlice } from "store/applicationSettings";
import { selectActiveKnownCategories } from "store/project/reselectors";
import { selectActiveClassifierModel } from "@ProjectViewer/state/reselectors";
import { classifierSlice } from "store/classifierV2";
import { selectActiveKindId } from "store/project/selectors";

import { AlertType } from "utils/enums";
import { getStackTraceFromError } from "utils/logUtils";
import type { AlertState } from "utils/types";
import { ModelStatus } from "utils/models/enums";

import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";

export const useEvaluateClassifier = () => {
  const dispatch = useDispatch();
  const { modelStatus, setModelStatus } = useClassifierStatus();
  const activeCategories = useSelector(selectActiveKnownCategories);
  const activeKindId = useSelector(selectActiveKindId);
  const selectedModel = useSelector(selectActiveClassifierModel);
  const handleError = useCallback(
    async (error: Error, name: string, initialModelStatus?: ModelStatus) => {
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
      setModelStatus(initialModelStatus ?? ModelStatus.Idle);
    },
    [dispatch],
  );
  const evaluateClassifier = async () => {
    if (!selectedModel) return;
    const initialModelStatus = modelStatus;
    if (!selectedModel.validationLoaded) {
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Info,
            name: "Validation set is empty",
            description: "Cannot evaluate model on empty validation set.",
          },
        }),
      );
    } else if (selectedModel.numClasses !== activeCategories.length) {
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Warning,
            name: "The output shape of your model does not correspond to the number of categories!",
            description: `The trained model has an output shape of ${selectedModel.numClasses} but there are ${activeCategories.length} categories in  the project.\nMake sure these numbers match by retraining the model with the given setup or upload a corresponding new model.`,
          },
        }),
      );
    } else {
      setModelStatus(ModelStatus.Evaluating);
      try {
        const evaluationResult = await selectedModel.evaluate();
        dispatch(
          classifierSlice.actions.updateEvaluationResult({
            evaluationResult,
            kindId: activeKindId,
          }),
        );
      } catch (error) {
        handleError(
          error as Error,
          "Error computing the evaluation results",
          initialModelStatus,
        );
        return;
      }
    }

    setModelStatus(initialModelStatus);
  };
  return evaluateClassifier;
};
