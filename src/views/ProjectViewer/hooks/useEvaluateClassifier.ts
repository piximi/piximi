import React from "react";

import { useDispatch, useSelector } from "react-redux";

import { applicationSettingsSlice } from "store/applicationSettings";
import { selectActiveKnownCategories } from "@ProjectViewer/state/reselectors";
import { classifierSlice } from "store/classifier";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import {
  selectKindClassifier,
  selectModelLifecycleStatus,
} from "store/classifier/selectors";

import { AlertType } from "utils/enums";
import classifierHandler from "utils/dl/classification/classifierHandler";

import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

export const useEvaluateClassifier = () => {
  const dispatch = useDispatch();
  const activeCategories = useSelector(selectActiveKnownCategories);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const handleError = useClassifierErrorHandler();

  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget,
  );
  const modelStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget,
  );
  const evaluateClassifier = async () => {
    if (!kindClassifier || kindClassifier.activeModel === undefined) return;
    const modelName = kindClassifier.activeModel;
    const model = classifierHandler.getModel(modelName);
    const modelInfo = kindClassifier.modelInfoDict[modelName];
    if (!model || !modelInfo) return;
    const currentRun = modelInfo.runs.at(-1);
    if (!currentRun) return;

    const initialModelStatus = modelStatus;
    if (!model.validationLoaded) {
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Info,
            name: "Validation set is empty",
            description: "Cannot evaluate model on empty validation set.",
          },
        }),
      );
    } else if (model.numClasses !== activeCategories.length) {
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Warning,
            name: "The output shape of your model does not correspond to the number of categories!",
            description: `The trained model has an output shape of ${model.numClasses} but there are ${activeCategories.length} categories in  the project.\nMake sure these numbers match by retraining the model with the given setup or upload a corresponding new model.`,
          },
        }),
      );
    } else {
      dispatch(
        classifierSlice.actions.setModelStatus({
          kindId: kindClassifier.kindId,
          status: "evaluating",
        }),
      );
      try {
        const evalResult = await classifierHandler.evaluate(modelName);
        dispatch(
          classifierSlice.actions.recordEvalForRun({
            evalResult,
            kindId: modelTarget,
            runId: currentRun.id,
            modelName: model.name,
          }),
        );
      } catch (error) {
        handleError(error as Error, "Error computing the evaluation results");
        dispatch(
          classifierSlice.actions.setModelStatus({
            kindId: kindClassifier.kindId,
            status: initialModelStatus,
          }),
        );
        return;
      }
    }

    dispatch(
      classifierSlice.actions.setModelStatus({
        kindId: kindClassifier.kindId,
        status: initialModelStatus,
      }),
    );
  };
  return evaluateClassifier;
};
