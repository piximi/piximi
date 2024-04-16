import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

import { Box, CssBaseline } from "@mui/material";

import { useErrorHandler, useUnloadConfirmation } from "hooks";

import { applicationSettingsSlice } from "store/applicationSettings";
import { projectSlice } from "store/project";

import { ProjectDrawer, ImageToolDrawer } from "components/drawers";
import { FallBackDialog } from "components/dialogs";
import { dimensions } from "utils/common/constants";
import { CustomTabSwitcher } from "components/styled-components";
import { selectAllKindIds } from "store/data/selectors";
import { ImageGrid } from "components/image-grids";
import { ProjectAppBar } from "components/app-bars/";
import { HotkeyView } from "utils/common/enums";
import { dataSlice } from "store/data/dataSlice";

export const ProjectViewer = () => {
  const dispatch = useDispatch();

  const kinds = useSelector(selectAllKindIds) as string[];

  useErrorHandler();
  useUnloadConfirmation();

  const handleTabClose = (item: string, newItem?: string) => {
    if (newItem) {
      dispatch(projectSlice.actions.setActiveKind({ kind: newItem }));
    }
    dispatch(dataSlice.actions.deleteKind({ deletedKindId: item }));
  };

  const handleTabChange = (tab: string) => {
    dispatch(projectSlice.actions.setActiveKind({ kind: tab }));
  };

  useEffect(() => {
    dispatch(
      applicationSettingsSlice.actions.registerHotkeyView({
        hotkeyView: HotkeyView.ProjectView,
      })
    );
    return () => {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyView({
          hotkeyView: HotkeyView.ProjectView,
        })
      );
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
              <CustomTabSwitcher
                childClassName="grid-tabs"
                labels={kinds}
                secondaryEffect={handleTabChange}
                onTabClose={handleTabClose}
              >
                {kinds.map((kind) => (
                  <ImageGrid key={`${kind}-imageGrid`} kind={kind} />
                ))}
              </CustomTabSwitcher>
            </Box>
            {process.env.NODE_ENV === "development" && <ImageToolDrawer />}
          </Box>
        </div>
      </ErrorBoundary>
    </div>
  );
};
