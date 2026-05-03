import { useCallback } from "react";

import { useDispatch } from "react-redux";

import { applicationSettingsSlice } from "store/applicationSettings";

import { AlertType } from "utils/enums";
import { getStackTraceFromError } from "utils/logUtils";
import { ModelStatus } from "utils/dl/enums";
import type { AlertState } from "utils/types";

import { useClassifierStatus } from "../contexts/ClassifierStatusProvider";

const formatErrorChain = (error: Error): string => {
  const lines: string[] = [`${error.name}: ${error.message}`];
  let cause: unknown = error.cause;
  while (cause instanceof Error) {
    lines.push(`  caused by → ${cause.name}: ${cause.message}`);
    cause = cause.cause;
  }
  return lines.join("\n");
};

export const useClassifierErrorHandler = () => {
  const dispatch = useDispatch();
  const { setModelStatus } = useClassifierStatus();

  return useCallback(
    async (error: Error, name: string, revertStatus?: ModelStatus) => {
      const stackTrace = await getStackTraceFromError(error);
      const alertState: AlertState = {
        alertType: AlertType.Error,
        name,
        description: formatErrorChain(error),
        stackTrace,
      };
      if (import.meta.env.NODE_ENV !== "production") {
        // Log the Error object itself so DevTools renders the full cause chain
        // and stack. The formatted strings above are what users see in the alert.
        console.error(name, error);
      }
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({ alertState }),
      );
      setModelStatus(revertStatus ?? ModelStatus.Idle);
    },
    [dispatch, setModelStatus],
  );
};
