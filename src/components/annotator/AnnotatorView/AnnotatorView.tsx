import { FallBackDialog } from "components/common/FallBackDialog/FallBackDialog";
import React, { useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDispatch } from "react-redux";
import { applicationSlice } from "store/slices";
import { AlertType } from "types/AlertStateType";
import { getStackTraceFromError } from "utils/getStackTrace";
import { ImageViewer } from "../ImageViewer";

export const AnnotatorView = () => {
  const dispatch = useDispatch();

  const handleError = useCallback(
    async (e: any) => {
      e.preventDefault();
      var error = e.error as Error;
      const stackTrace = await getStackTraceFromError(error);
      dispatch(
        applicationSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: error.name,
            description: error.message,
            stackTrace: stackTrace,
          },
        })
      );
    },
    [dispatch]
  );

  const handleUncaughtRejection = useCallback(
    async (e: any) => {
      e.preventDefault();
      dispatch(
        applicationSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: "Uncaught promise rejection",
            description: String(e.reason.message),
            stackTrace: String(e.reason.stack),
          },
        })
      );
    },
    [dispatch]
  );

  React.useEffect(() => {
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUncaughtRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUncaughtRejection);
    };
  }, [handleError, handleUncaughtRejection]);

  return (
    <ErrorBoundary FallbackComponent={FallBackDialog}>
      <ImageViewer />
    </ErrorBoundary>
  );
};
