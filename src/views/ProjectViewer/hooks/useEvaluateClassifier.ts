import React from "react";

import { useDispatch, useSelector } from "react-redux";

import { applicationSettingsSlice } from "store/applicationSettings";
import {
  selectActiveClassifierModel,
  selectActiveClassifierModelNameOrArch,
  selectActiveKnownCategories,
} from "@ProjectViewer/state/reselectors";
import { classifierSlice } from "store/classifierV2";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";

import { AlertType } from "utils/enums";
import classifierHandler from "utils/modelsV2/classification/classifierHandler";
import { ModelStatus } from "utils/modelsV2/enums";

import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";
import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

export const useEvaluateClassifier = () => {
  const dispatch = useDispatch();
  const { modelStatus, setModelStatus } = useClassifierStatus();
  const activeCategories = useSelector(selectActiveKnownCategories);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const selectedModel = useSelector(selectActiveClassifierModel);
  const modelNameOrArch = useSelector(selectActiveClassifierModelNameOrArch);
  const handleError = useClassifierErrorHandler();
  const evaluateClassifier = async () => {
    if (typeof modelNameOrArch !== "string" || !selectedModel) return;
    const modelName = modelNameOrArch;
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
        const evaluationResult = await classifierHandler.evaluate(modelName);
        dispatch(
          classifierSlice.actions.updateEvaluationResult({
            evaluationResult,
            kindId: modelTarget.id,
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
