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
      if (import.meta.env.NODE_ENV !== "production") {
        // Log the raw rejection so DevTools shows the full stack + cause chain.
        // We preventDefault below, which otherwise silences the browser's
        // default unhandledrejection logging.
        console.error("Unhandled promise rejection:", e.reason);
      }
      e.preventDefault();
      const reason: unknown = e.reason;
      const message =
        reason instanceof Error ? reason.message : String(reason);
      const stack =
        reason instanceof Error ? String(reason.stack) : undefined;
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: "Uncaught promise rejection",
            description: message,
            stackTrace: stack,
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
