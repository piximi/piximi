import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";
import { Box } from "@mui/material";

import { useErrorHandler, useMobileView, useUnloadConfirmation } from "hooks";

import { FallbackDialog } from "components/dialogs";
import {
  ProjectDrawer,
  ImageToolDrawer,
  ProjectAppBar,
  ProjectImageGrid,
} from "./sections";

import { projectSlice } from "store/project";
import { applicationSettingsSlice } from "store/applicationSettings";

import { HotkeyContext } from "utils/enums";
import { DIMENSIONS } from "utils/constants";

export const ProjectViewer = () => {
  const dispatch = useDispatch();
  const isMobile = useMobileView();

  useErrorHandler();
  useUnloadConfirmation();

  useEffect(() => {
    dispatch(
      applicationSettingsSlice.actions.registerHotkeyContext({
        context: HotkeyContext.ProjectView,
      }),
    );
    dispatch(projectSlice.actions.setActiveKind({ kind: "Image" }));
    return () => {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: HotkeyContext.ProjectView,
        }),
      );
    };
  }, [dispatch]);

  return (
    <div>
      <ErrorBoundary FallbackComponent={FallbackDialog}>
        <div tabIndex={-1}>
          <Box
            sx={{
              height: "100vh",
              display: "grid",
              gridTemplateColumns: !isMobile
                ? `${DIMENSIONS.leftDrawerWidth}px 1fr ${DIMENSIONS.toolDrawerWidth}px`
                : `1fr ${DIMENSIONS.toolDrawerWidth}px`,
              gridTemplateRows: `${DIMENSIONS.toolDrawerWidth}px 1fr`,
              gridTemplateAreas: !isMobile
                ? '"top-tools top-tools top-tools"  "action-drawer image-grid side-tools"'
                : '"top-tools top-tools" "image-grid side-tools"',
            }}
          >
            <ProjectAppBar />
            {!isMobile && <ProjectDrawer />}

            <ProjectImageGrid />
            <ImageToolDrawer />
          </Box>
        </div>
      </ErrorBoundary>
    </div>
  );
};
