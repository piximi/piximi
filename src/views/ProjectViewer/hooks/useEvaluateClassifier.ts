import { useDispatch, useSelector } from "react-redux";

import { applicationSettingsSlice } from "store/applicationSettings";
import { selectActiveKnownCategories } from "@ProjectViewer/state/reselectors";
import { classifierSlice } from "store/classifier";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";
import { useClassifierApi } from "core/dl/classification";

import { AlertType } from "utils/enums";

import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

import type { ModelInfoDTO } from "core/dl/classification/types";

export const useEvaluateClassifier = () => {
  const dispatch = useDispatch();
  const activeCategories = useSelector(selectActiveKnownCategories);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const handleError = useClassifierErrorHandler();

  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget,
  );

  const cfApi = useClassifierApi();

  const evaluateClassifier = async () => {
    if (!kindClassifier || kindClassifier.activeModel === undefined) return;
    const modelName = kindClassifier.activeModel;

    const result = await cfApi.getModelInfo(modelName);
    let model: ModelInfoDTO | undefined = undefined;
    if (result.success) model = result.data;
    else {
      console.error(
        `[evaluateClassifier: ${modelName}] ${result.reason.code}: ${result.reason.message}`,
        result.reason.cause,
      );
    }
    const modelInfo = kindClassifier.modelInfoDict[modelName];
    if (!model || !modelInfo) return;
    const currentRun = modelInfo.runs.at(-1);
    if (!currentRun) return;

    const initialModelStatus = kindClassifier.status;
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
          targetId: kindClassifier.modelTargetId,
          status: "evaluating",
        }),
      );
      try {
        const evalResult = await cfApi.evaluate(modelName);
        if (evalResult.success) {
          dispatch(
            classifierSlice.actions.recordEvalForRun({
              evalResult: evalResult.data,
              targetId: modelTarget,
              runId: currentRun.id,
              modelName: model.name,
            }),
          );
        } else {
          throw new Error(
            `[evaluateClassifier: ${modelName}] ${evalResult.reason.code}: ${evalResult.reason.message}`,
            { cause: evalResult.reason.cause },
          );
        }
      } catch (error) {
        handleError(error as Error, "Error computing the evaluation results");
        dispatch(
          classifierSlice.actions.setModelStatus({
            targetId: kindClassifier.modelTargetId,
            status: initialModelStatus,
          }),
        );
        return;
      }
    }

    dispatch(
      classifierSlice.actions.setModelStatus({
        targetId: kindClassifier.modelTargetId,
        status: initialModelStatus,
      }),
    );
  };
  return evaluateClassifier;
};
