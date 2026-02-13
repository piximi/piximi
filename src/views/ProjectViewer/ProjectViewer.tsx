import React, { useEffect, useMemo } from "react";
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
import { KindItemsProvider } from "contexts/KindItemsProvider";
import { IMAGE_KIND } from "store/data/constants";
import { PipelineProgressIndicator } from "components/ui/PipelineProgressIndicator";

export const ProjectViewer = React.memo(() => {
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
    dispatch(projectSlice.actions.setActiveKind({ kind: IMAGE_KIND }));
    return () => {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: HotkeyContext.ProjectView,
        }),
      );
    };
  }, [dispatch]);

  const styles = useMemo(
    () => ({
      height: "100vh",
      display: "grid",
      gridTemplateColumns: !isMobile
        ? `${DIMENSIONS.leftDrawerWidth}px 1fr ${DIMENSIONS.toolDrawerWidth}px`
        : `1fr ${DIMENSIONS.toolDrawerWidth}px`,
      gridTemplateRows: `${DIMENSIONS.toolDrawerWidth}px 1fr`,
      gridTemplateAreas: !isMobile
        ? '"top-tools top-tools top-tools"  "action-drawer image-grid side-tools"'
        : '"top-tools top-tools" "image-grid side-tools"',
    }),
    [isMobile],
  );

  return (
    <div>
      <ErrorBoundary FallbackComponent={FallbackDialog}>
        <div tabIndex={-1}>
          <PipelineProgressIndicator />
          <Box sx={styles}>
            <KindItemsProvider>
              <ProjectAppBar />
              {!isMobile && <ProjectDrawer />}

              <ProjectImageGrid />
              <ImageToolDrawer />
            </KindItemsProvider>
          </Box>
        </div>
      </ErrorBoundary>
    </div>
  );
});
