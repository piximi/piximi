import React, { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import Konva from "konva";
import { useDispatch } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";
import { Box } from "@mui/material";

import { useMobileView, useUnloadConfirmation } from "hooks";

import { FallbackDialog } from "components/dialogs";
import { ImageViewerDrawer, StageWrapper } from "./sections";

import { StageContext } from "views/ImageViewer/state/StageContext";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { applicationSettingsSlice } from "store/applicationSettings";

import { DIMENSIONS } from "utils/constants";
import { getStackTraceFromError } from "utils/logUtils";
import { AlertType, HotkeyContext } from "utils/enums";
import { SideToolBar, TopToolBar } from "./sections/tool-bars";
import { MobileActionBar } from "./sections/tool-bars/MobileActionBar";

export const ImageViewer = () => {
  const dispatch = useDispatch();
  const routerLocation = useLocation();
  const stageRef = useRef<Konva.Stage>(null);
  const isMobile = useMobileView();
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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `${isMobile ? DIMENSIONS.toolDrawerWidth : DIMENSIONS.toolDrawerWidth + DIMENSIONS.leftDrawerWidth}px 1fr ${DIMENSIONS.toolDrawerWidth}px`,
            gridTemplateRows: `${DIMENSIONS.toolDrawerWidth}px 1fr`,
            gridTemplateAreas: `"top-tools top-tools top-tools" "${isMobile ? "mobile-action-bar" : "action-drawer"} stage side-tools"`,
            overflow: "hidden",
            maxHeight: "100vh",
          }}
        >
          <TopToolBar />
          {isMobile ? <MobileActionBar /> : <ImageViewerDrawer />}

          <StageWrapper />
          <SideToolBar />
        </Box>
      </ErrorBoundary>
    </StageContext.Provider>
  );
};
