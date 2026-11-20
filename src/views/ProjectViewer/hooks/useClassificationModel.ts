import { useSelector } from "react-redux";

import { selectActiveClassifier } from "store/classifier/selectors";
import { useParameterizedSelector } from "store/hooks";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";

import type { Classifier } from "core/dl/classification/types";

/* The active classifier's record, as the backend last announced it. */
export const useClassificationModel = (): Classifier | undefined => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  return useParameterizedSelector(selectActiveClassifier, modelTarget);
};
