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
    (async () => {
      const cfApi = ClassifierApi.getInstance();
      const response = await cfApi.getModelInfo(activeClassifier);
      setModelInfo(response);
    })();
  }, [activeClassifier]);
  return modelInfo;
};
