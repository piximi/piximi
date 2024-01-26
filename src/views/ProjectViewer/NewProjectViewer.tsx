import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

import { Box, CssBaseline } from "@mui/material";

import { useErrorHandler, useUnloadConfirmation } from "hooks";

import {
  registerHotkeyView,
  unregisterHotkeyView,
} from "store/slices/applicationSettings";
import { projectSlice } from "store/slices/project";

import { HotkeyView } from "types";
import { ProjectDrawer, ImageToolDrawer } from "components/drawers";
import { ProjectAppBar } from "components/app-bars";
import { FallBackDialog } from "components/dialogs";
import { dimensions } from "utils/common";
import { NewCustomTabSwitcher } from "components/styled-components/CustomTabSwitcher/NewCustomTabSwitcher";
import { selectAllKindIds } from "store/slices/newData/selectors/selectors";
import { ImageGridNew } from "components/image-grids/ImageGrid/ImageGridNew";

export const NewProjectViewer = () => {
  const dispatch = useDispatch();

  const kinds = useSelector(selectAllKindIds) as string[];

  useErrorHandler();
  useUnloadConfirmation();

  const handleTabChange = (tab: string) => {
    dispatch(projectSlice.actions.setActiveKind({ kind: tab }));
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
                maxWidth: `calc(100% - ${dimensions.leftDrawerWidth}px - ${dimensions.toolDrawerWidth}px)`, // magic number draw width
                overflow: "hidden",
                flexGrow: 1,
                height: "100%",
                paddingTop: theme.spacing(8),
                marginLeft: theme.spacing(32),
              })}
            >
              <NewCustomTabSwitcher
                childClassName="grid-tabs"
                labels={kinds}
                secondaryEffect={handleTabChange}
              >
                {kinds.map((kind) => (
                  <ImageGridNew key={`${kind}-imageGrid`} kind={kind} />
                ))}
              </NewCustomTabSwitcher>
            </Box>
            {process.env.NODE_ENV === "development" && <ImageToolDrawer />}
          </Box>
        </div>
      </ErrorBoundary>
    </div>
  );
};
