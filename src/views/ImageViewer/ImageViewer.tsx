import React, { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import Konva from "konva";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";
import { AppBar, Box } from "@mui/material";

import { useMobileView, useUnloadConfirmation } from "hooks";
import { AlertBar } from "components/ui/AlertBar";

import { FallbackDialog } from "components/dialogs";
import { ImageViewerDrawer, StageWrapper } from "./sections";

import { StageContext } from "views/ImageViewer/state/StageContext";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { applicationSettingsSlice } from "store/applicationSettings";
import { selectAlertState } from "store/applicationSettings/selectors";

import { APPLICATION_COLORS } from "utils/constants";
import { getStackTraceFromError } from "utils/logUtils";
import { AlertType, HotkeyContext } from "utils/enums";

export const ImageViewer = () => {
  const dispatch = useDispatch();
  const routerLocation = useLocation();
  const stageRef = useRef<Konva.Stage>(null);
  const isMobile = useMobileView();
  const alertState = useSelector(selectAlertState);
  useUnloadConfirmation();

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
      <ErrorBoundary FallbackComponent={FallbackDialog}>
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
