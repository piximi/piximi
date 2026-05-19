import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectActiveModelName } from "store/classifier/selectors";
import { useParameterizedSelector } from "store/hooks";
import { ClassifierApi } from "utils/dl/classification/ClassifierApi";
import { ModelInfoDTO } from "utils/dl/classification/types";

export const useClassificationModel = () => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const activeClassifier = useParameterizedSelector(
    selectActiveModelName,
    modelTarget,
  );
  const [modelInfo, setModelInfo] = useState<ModelInfoDTO>();
  useEffect(() => {
    if (!activeClassifier) return;
    let cancelled = false;
    ClassifierApi.getInstance()
      .getModelInfo(activeClassifier)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setModelInfo(result.data);
        } else {
          console.error(
            `[useClassificationModel] ${result.reason.code}: ${result.reason.message}`,
            result.reason.cause,
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeClassifier]);
  return modelInfo;
};
