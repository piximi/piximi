import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { selectActiveModelName } from "store/classifier/selectors";
import { useParameterizedSelector } from "store/hooks";

import { useClassifierApi } from "utils/dl/classification";
import type { ModelInfoDTO } from "utils/dl/classification/types";

export const useClassificationModel = () => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const activeModelName = useParameterizedSelector(
    selectActiveModelName,
    modelTarget,
  );
  const [modelInfo, setModelInfo] = useState<ModelInfoDTO>();

  const cfApi = useClassifierApi();
  useEffect(() => {
    if (!activeModelName) return;
    let cancelled = false;
    cfApi.getModelInfo(activeModelName).then((result) => {
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
  }, [activeModelName]);
  return modelInfo;
};
