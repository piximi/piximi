import React, { useEffect, useRef } from "react";
import Konva from "konva";
import { useDispatch } from "react-redux";
import { Box } from "@mui/material";

import { useErrorHandler, useMobileView, useUnloadConfirmation } from "hooks";

import { ImageViewerDrawer, StageWrapper } from "./sections";

import { StageContext } from "views/ImageViewer/state/StageContext";
import { applicationSettingsSlice } from "store/applicationSettings";

import { DIMENSIONS } from "utils/constants";
import { HotkeyContext } from "utils/enums";
import { SideToolBar, TopToolBar } from "./sections/tool-bars";
import { MobileActionBar } from "./sections/tool-bars/MobileActionBar";
import { DataProvider } from "./state/DataContext";
import { DrawerActionSelection } from "./sections/ImageViewerDrawer/DrawerActionSelection";
import { DrawerViewProvider } from "./state/DrawerViewContext";
import { TrackletProvider } from "./state/TrackletContext";
import { ViewErrorBoundary } from "components/errors";

export const ImageViewer = () => {
  const dispatch = useDispatch();

  const stageRef = useRef<Konva.Stage>(null);
  const isMobile = useMobileView();
  useUnloadConfirmation();
  useErrorHandler();

  useEffect(() => {
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
  }, [dispatch]);

  return (
    <ViewErrorBoundary viewName="ImageViewer">
      <DataProvider>
        <TrackletProvider>
          <DrawerViewProvider>
            <StageContext.Provider value={stageRef}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: `${DIMENSIONS.toolDrawerWidth}px 1fr`,
                  gridTemplateRows: "1fr",
                  gridTemplateAreas: `"drawer-action-selection viewer-grid"`,
                  maxHeight: "100vh",
                  minWidth: "100%",
                }}
              >
                <DrawerActionSelection />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: `${isMobile ? DIMENSIONS.toolDrawerWidth + "px" : ` ${DIMENSIONS.leftDrawerWidth}px`} 1fr ${DIMENSIONS.toolDrawerWidth}px`,
                    gridTemplateRows: `${DIMENSIONS.toolDrawerWidth}px 1fr`,
                    gridTemplateAreas: `"top-tools top-tools top-tools" "${isMobile ? "mobile-action-bar" : "action-drawer"} stage side-tools"`,
                    overflow: "hidden",
                    maxHeight: "100vh",
                    gridArea: "viewer-grid",
                  }}
                >
                  <TopToolBar />
                  {isMobile ? <MobileActionBar /> : <ImageViewerDrawer />}

                  <StageWrapper />
                  <SideToolBar />
                </Box>
              </Box>
            </StageContext.Provider>
          </DrawerViewProvider>
        </TrackletProvider>
      </DataProvider>
    </ViewErrorBoundary>
  );
};
