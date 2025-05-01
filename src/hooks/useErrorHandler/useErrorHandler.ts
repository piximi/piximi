import { useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";

import { applicationSettingsSlice } from "store/applicationSettings";

import { getStackTraceFromError } from "utils/logUtils";

import { AlertType } from "utils/enums";

export const useErrorHandler = () => {
  const dispatch = useDispatch();
  const handleError = useCallback(
    async (e: any) => {
      e.preventDefault();
      const error = e.error as Error;
      const stackTrace = await getStackTraceFromError(error);
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: error.name,
            description: error.message,
            stackTrace: stackTrace,
          },
        }),
      );
    },
    [dispatch],
  );

  const handleUncaughtRejection = useCallback(
    async (e: any) => {
      e.preventDefault();
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: "Uncaught promise rejection",
            description: String(e.reason.message),
            stackTrace: String(e.reason.stack),
          },
        }),
      );
    },
    [dispatch],
  );

  useEffect(() => {
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUncaughtRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUncaughtRejection);
    };
  }, [handleError, handleUncaughtRejection]);
};
