import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

import { Box, CssBaseline } from "@mui/material";

import { useErrorHandler, useUnloadConfirmation } from "hooks";
import { useDefaultImage, DispatchLocation } from "hooks/useDefaultImage";

import {
  registerHotkeyView,
  unregisterHotkeyView,
} from "store/applicationSettings";
import { projectSlice } from "store/project";

import { HotkeyView, ImageGridTab } from "types";
import { ProjectDrawer } from "components/drawers";
import { ProjectAppBar } from "components/app-bars";
import { CustomTabSwitcher } from "components/styled-components";
import { AnnotationImageGrid, ImageGrid } from "components/image-grids";
import { FallBackDialog } from "components/dialogs";
import { selectTotalAnnotationCount } from "store/data";

const tabs: Array<ImageGridTab> = ["Images", "Annotations"];

export const ProjectViewer = () => {
  const dispatch = useDispatch();

  const annotationCount = useSelector(selectTotalAnnotationCount);

  useDefaultImage(DispatchLocation.Project);
  useErrorHandler();
  useUnloadConfirmation();

  const handleTabChange = (newValue: number) => {
    dispatch(projectSlice.actions.setImageGridTab({ view: tabs[newValue] }));
    //TODO: should maybe also change ctegories tab
  };

  useEffect(() => {
    dispatch(registerHotkeyView({ hotkeyView: HotkeyView.ProjectView }));
    return () => {
      dispatch(unregisterHotkeyView({ hotkeyView: HotkeyView.ProjectView }));
    };
  }, [dispatch]);

  return (
    <div>
      <ErrorBoundary FallbackComponent={FallBackDialog}>
        <div tabIndex={-1}>
          <Box sx={{ height: "100vh" }}>
            <CssBaseline />
            <ProjectAppBar />

            <ProjectDrawer />

            <Box
              sx={(theme) => ({
                maxWidth: "calc(100% - 256px)", // magic number draw width
                overflow: "hidden",
                flexGrow: 1,
                height: "100%",
                paddingTop: theme.spacing(8),
                marginLeft: theme.spacing(32),
              })}
            >
              <CustomTabSwitcher
                childClassName="grid-tabs"
                label1="Images"
                label2="Annotations"
                disabledTabs={annotationCount === 0 ? [1] : undefined}
                secondaryEffect={handleTabChange}
              >
                <ImageGrid />
                {annotationCount === 0 ? <></> : <AnnotationImageGrid />}
              </CustomTabSwitcher>
            </Box>
          </Box>
        </div>
      </ErrorBoundary>
    </div>
  );
};
