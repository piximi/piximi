import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

import { Box, CssBaseline } from "@mui/material";

import { useErrorHandler, useUnloadConfirmation } from "hooks";

import { applicationSettingsSlice } from "store/applicationSettings";
import { projectSlice } from "store/project";

import { ProjectDrawerNew, ImageToolDrawerNew } from "components/drawers";
import { FallBackDialog } from "components/dialogs";
import { dimensions } from "utils/common/constants";
import { NewCustomTabSwitcher } from "components/styled-components";
import { selectAllKindIds } from "store/data/selectors";
import { ImageGridNew } from "components/image-grids";
import { ProjectAppBarNew } from "components/app-bars/";
import { HotkeyView } from "utils/common/enums";

export const ProjectViewerNew = () => {
  const dispatch = useDispatch();

  const kinds = useSelector(selectAllKindIds) as string[];

  useErrorHandler();
  useUnloadConfirmation();

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
            <ProjectAppBarNew />

            <ProjectDrawerNew />

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
            {process.env.NODE_ENV === "development" && <ImageToolDrawerNew />}
          </Box>
        </div>
      </ErrorBoundary>
    </div>
  );
};
