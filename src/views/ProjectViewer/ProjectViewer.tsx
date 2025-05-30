import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";
import { Box } from "@mui/material";

import { useErrorHandler, useUnloadConfirmation } from "hooks";

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

export const ProjectViewer = () => {
  const dispatch = useDispatch();

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
