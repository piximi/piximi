import { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useBackend } from "core/backend";

import { classifierSlice } from "store/classifier";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";

import { useClassMapDialog } from "@ProjectViewer/contexts/class-map";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { selectActiveKnownCategories } from "@ProjectViewer/state/reselectors";

import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

/*
 * Labels the target's unlabeled items with the active classifier. The
 * backend writes the predictions and keeps them in the inference partition
 * until they are accepted or cleared.
 */
export const usePredictClassifier = () => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const activeCategories = useSelector(selectActiveKnownCategories);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget,
  );
  const { getClassMap } = useClassMapDialog();
  const handleError = useClassifierErrorHandler();

  const predictClassifier = useCallback(async () => {
    const { classification } = backend;
    const activeId = kindClassifier.activeModel;
    if (!classification || !activeId) return;
    let record = kindClassifier.modelInfoDict[activeId];
    if (!record) return;

    if (!record.classMap) {
      if (record.classes.length === 0) return;
      const mapping = await getClassMap({
        projectCategories: activeCategories,
        modelClasses: record.classes,
      });
      if (!mapping) return;
      record = await classification.update({
        classifierId: record.id,
        classMap: mapping,
      });
    }

    const setStatus = (status: "predicting" | "waiting" | "idle") =>
      dispatch(
        classifierSlice.actions.setModelStatus({
          targetId: modelTarget,
          status,
        }),
      );
    setStatus("predicting");
    try {
      await classification.predict({ classifierId: record.id });
      setStatus("waiting");
    } catch (error) {
      handleError(error as Error, "Error during prediction");
      setStatus("idle");
    }
  }, [
    backend,
    dispatch,
    handleError,
    activeCategories,
    kindClassifier,
    getClassMap,
    modelTarget,
  ]);

  return predictClassifier;
};
