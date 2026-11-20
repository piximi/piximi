import { useDispatch, useSelector } from "react-redux";

import { useBackend } from "core/backend";

import { applicationSettingsSlice } from "store/applicationSettings";
import { classifierSlice } from "store/classifier";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";

import { AlertType } from "utils/enums";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { selectActiveKnownCategories } from "@ProjectViewer/state/reselectors";

import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

/* Evaluates the active classifier's latest run on its validation set. */
export const useEvaluateClassifier = () => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const activeCategories = useSelector(selectActiveKnownCategories);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const handleError = useClassifierErrorHandler();
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget,
  );

  const evaluateClassifier = async () => {
    const { classification } = backend;
    const activeId = kindClassifier.activeModel;
    if (!classification || !activeId) return;
    const record = kindClassifier.modelInfoDict[activeId];
    if (!record || record.runs.length === 0) return;

    if (
      record.classes.length > 0 &&
      record.classes.length !== activeCategories.length
    ) {
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Warning,
            name: "The output shape of your model does not correspond to the number of categories!",
            description: `The trained model has an output shape of ${record.classes.length} but there are ${activeCategories.length} categories in  the project.\nMake sure these numbers match by retraining the model with the given setup or upload a corresponding new model.`,
          },
        }),
      );
      return;
    }

    const initialStatus = kindClassifier.status;
    const setStatus = (status: typeof initialStatus) =>
      dispatch(
        classifierSlice.actions.setModelStatus({
          targetId: modelTarget,
          status,
        }),
      );
    setStatus("evaluating");
    try {
      await classification.evaluate(record.id);
    } catch (error) {
      handleError(error as Error, "Error computing the evaluation results");
    } finally {
      setStatus(initialStatus);
    }
  };
  return evaluateClassifier;
};
