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

  React.useEffect(() => {
    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("error", handleError);
    };
  }, [handleError]);

  return (
    <ErrorBoundary FallbackComponent={FallBackDialog}>
      <ImageViewer />
    </ErrorBoundary>
  );
};
