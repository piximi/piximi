import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

import { Box } from "@mui/material";

import { useErrorHandler, useUnloadConfirmation } from "hooks";

import { applicationSettingsSlice } from "store/applicationSettings";

import { ProjectDrawer, ImageToolDrawer } from "sections/drawers";
import { FallBackDialog } from "sections/dialogs";
import { ProjectAppBar } from "sections/app-bars";
import { HotkeyContext } from "utils/common/enums";
import { ProjectImageGrid } from "sections/ProjectImageGrid";

export const ProjectViewer = () => {
  const dispatch = useDispatch();

  useErrorHandler();
  useUnloadConfirmation();

  useEffect(() => {
    dispatch(
      applicationSettingsSlice.actions.registerHotkeyContext({
        context: HotkeyContext.ProjectView,
      })
    );
    return () => {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: HotkeyContext.ProjectView,
        })
      );
    };
  }, [dispatch]);

  return (
    <div>
      <ErrorBoundary FallbackComponent={FallBackDialog}>
        <div tabIndex={-1}>
          <Box sx={{ height: "100vh" }}>
            <ProjectAppBar />

            <ProjectDrawer />

            <ProjectImageGrid />
            <ImageToolDrawer />
          </Box>
        </div>
      </ErrorBoundary>
    </div>
  );
};
