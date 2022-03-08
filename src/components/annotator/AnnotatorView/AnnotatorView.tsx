import { FallBackDialog } from "components/common/FallBackDialog/FallBackDialog";
import React, { useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDispatch } from "react-redux";
import { applicationSlice } from "store/slices";
import { AlertType } from "types/AlertStateType";
import { ImageViewer } from "../ImageViewer";

export const AnnotatorView = () => {
  const dispatch = useDispatch();

  const handleError = useCallback(
    (e: any) => {
      dispatch(
        applicationSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: e.message,
            description: e.error.message,
            stackTrace: e.error.stack,
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
