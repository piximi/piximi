import { useDispatch, useSelector } from "react-redux";

import { useBackend } from "core/backend";

import { classifierSlice } from "store/classifier";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";

import { useClassifierErrorHandler } from "./useClassifierErrorHandler";

/*
 * Settles the target's pending predictions through the backend: accepting
 * keeps the categories and unassigns the items; clearing returns them to
 * unknown. Either way the classifier is idle afterwards.
 */
export const useAcceptClearPredictions = () => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const handleError = useClassifierErrorHandler();

  const settle = async (
    action: "acceptPredictions" | "clearPredictions",
    name: string,
  ) => {
    const { classification } = backend;
    if (!classification) return;
    try {
      await classification[action](modelTarget);
      dispatch(
        classifierSlice.actions.setModelStatus({
          targetId: modelTarget,
          status: "idle",
        }),
      );
    } catch (error) {
      handleError(error as Error, name);
    }
  };

  return {
    acceptPredictions: () =>
      settle("acceptPredictions", "Could not accept the predictions"),
    clearPredictions: () =>
      settle("clearPredictions", "Could not clear the predictions"),
  };
};
