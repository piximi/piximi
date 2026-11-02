import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import { useClassifierApi } from "core/dl/classification";

import {
  selectActiveModelName,
  selectModelLifecycleStatus,
} from "store/classifier/selectors";
import { useParameterizedSelector } from "store/hooks";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";

import type { ModelInfoDTO } from "core/dl/classification/types";

export const useClassificationModel = () => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const activeModelName = useParameterizedSelector(
    selectActiveModelName,
    modelTarget,
  );
  const modelStatus = useParameterizedSelector(
    selectModelLifecycleStatus,
    modelTarget,
  );

  const cfApi = useClassifierApi();

  const [result, setResult] = useState<{
    name: string;
    info: ModelInfoDTO;
  } | null>(null);

  useEffect(() => {
    if (!activeModelName) return;
    let cancelled = false;
    cfApi.getModelInfo(activeModelName).then((r) => {
      if (cancelled) return;
      if (r.success) setResult({ name: activeModelName, info: r.data });
      else
        console.error(
          `[useClassificationModel] ${r.reason.code}: ${r.reason.message}`,
          r.reason.cause,
        );
    });
    return () => {
      cancelled = true;
    };
    // modelStatus is a deliberate refetch trigger: training changes the summary.
  }, [activeModelName, modelStatus, cfApi]);

  return result && result?.name === activeModelName ? result.info : undefined;
};
