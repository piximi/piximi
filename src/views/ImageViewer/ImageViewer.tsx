import React, { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import Konva from "konva";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";
import { AppBar, Box } from "@mui/material";

import { useMobileView } from "hooks";
import { AlertBar } from "components/ui/AlertBar";

import { FallBackDialog } from "components/dialogs";
import { ImageViewerDrawer, StageWrapper } from "./sections";

import { StageContext } from "views/ImageViewer/state/StageContext";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { applicationSettingsSlice } from "store/applicationSettings";
import { selectAlertState } from "store/applicationSettings/selectors";

import { APPLICATION_COLORS } from "utils/common/constants";
import { getStackTraceFromError } from "utils/common/helpers";
import { AlertType, HotkeyContext } from "utils/common/enums";

export const ImageViewer = () => {
  const dispatch = useDispatch();
  const routerLocation = useLocation();

  const stageRef = useRef<Konva.Stage>(null);
  const isMobile = useMobileView();
  const alertState = useSelector(selectAlertState);

  const onUnload = (e: any) => {
    if (import.meta.env.NODE_ENV === "development") {
      return;
    } else {
      e.preventDefault();
      return (e.returnValue = "Are you sure you want to exit?");
    }
  };

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
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);
  useEffect(() => {
    dispatch(
      imageViewerSlice.actions.prepareImageViewer({
        selectedThingIds: routerLocation.state?.initialThingIds
          ? routerLocation.state.initialThingIds
          : [],
      }),
    );
    dispatch(
      applicationSettingsSlice.actions.registerHotkeyContext({
        context: HotkeyContext.AnnotatorView,
      }),
    );
    return () => {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: HotkeyContext.AnnotatorView,
        }),
      );
    };
  }, [dispatch, routerLocation.state]);

  useEffect(() => {
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUncaughtRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUncaughtRejection);
    };
  }, [handleError, handleUncaughtRejection]);

  return (
    <StageContext.Provider value={stageRef}>
      <ErrorBoundary FallbackComponent={FallBackDialog}>
        <Box sx={{ display: "flex" }}>
          {alertState.visible && (
            <AppBar
              sx={{
                borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
                boxShadow: "none",
                zIndex: 2000,
              }}
              color="inherit"
              position="fixed"
            >
              <AlertBar alertState={alertState} />
            </AppBar>
          )}

          {isMobile ? <></> : <ImageViewerDrawer />}

          <StageWrapper />
        </Box>
      </ErrorBoundary>
    </StageContext.Provider>
  );
};
