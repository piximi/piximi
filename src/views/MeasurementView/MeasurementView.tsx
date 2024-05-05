import React, { useEffect } from "react";
import { ErrorBoundary, useErrorHandler } from "react-error-boundary";
import { useDispatch, useSelector } from "react-redux";
import { Box, CssBaseline, AppBar } from "@mui/material";
import { MeasurementDashboard } from "components/data-viz";
import { FallBackDialog } from "components/dialogs";
import { MeasurementsDrawer } from "components/drawers";
import { TabbedView } from "components/styled-components";
import { useUnloadConfirmation } from "hooks";

import { AlertBar } from "components/app-bars";

import { Toolbar, Typography } from "@mui/material";

import { BlurActionTextField } from "components/styled-components/inputs";

import { LogoLoader } from "components/styled-components";
import {
  selectLoadMessage,
  selectLoadPercent,
  selectProjectImageChannels,
  selectProjectName,
} from "store/project/selectors";
import { projectSlice } from "store/project";
import { selectAlertState } from "store/applicationSettings/selectors";
import { dimensions } from "utils/common/constants";
import { HotkeyView } from "utils/common/enums";
import { applicationSettingsSlice } from "store/applicationSettings";
import { measurementsSlice } from "store/measurements/measurementsSlice";

export const ProjectToolbar = () => {
  const dispatch = useDispatch();
  const loadPercent = useSelector(selectLoadPercent);
  const loadMessage = useSelector(selectLoadMessage);
  const projectName = useSelector(selectProjectName);

  return (
    <Toolbar
      variant="dense"
      sx={{ backgroundColor: "transparent", backgroundImage: "none" }}
    >
      <LogoLoader width={200} height={30} loadPercent={loadPercent} />

      {loadMessage ? (
        <Typography ml={5} sx={{ flexGrow: 1 }}>
          {loadMessage}
        </Typography>
      ) : (
        <BlurActionTextField
          id="toolbar-project-name-input"
          currentText={projectName}
          callback={(name) =>
            dispatch(projectSlice.actions.setProjectName({ name }))
          }
          size="small"
          sx={{ ml: 2.5 }}
        />
      )}
    </Toolbar>
  );
};

const ProjectAppBar = () => {
  const alertState = useSelector(selectAlertState);

  return (
    <Box>
      <AppBar
        sx={{
          //borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
          boxShadow: "none",
          backgroundColor: "transparent",
          backgroundImage: "none",
        }}
        color="inherit"
        position="fixed"
      >
        <ProjectToolbar />

        {alertState.visible && <AlertBar alertState={alertState} />}
      </AppBar>
    </Box>
  );
};

export const MeasurementView = () => {
  const dispatch = useDispatch();
  const projectImageChannels = useSelector(selectProjectImageChannels);

  useErrorHandler();
  useUnloadConfirmation();

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

  useEffect(() => {
    dispatch(
      measurementsSlice.actions.updateChannelOptions({
        numChannels: projectImageChannels,
      })
    );
  }, [projectImageChannels, dispatch]);

  return (
    <ErrorBoundary FallbackComponent={FallBackDialog}>
      <Box
        sx={(theme) => ({
          height: "100vh",
          backgroundColor: theme.palette.background.paper,
        })}
      >
        <CssBaseline />
        <ProjectAppBar />

        <MeasurementsDrawer />

        <Box
          sx={(theme) => ({
            maxWidth: `calc(100% - ${
              dimensions.leftDrawerWidth
            }px - ${theme.spacing(2)})`,
            maxHeight: `calc(100vh - ${theme.spacing(8)})`,
            overflow: "hidden",
            flexGrow: 1,
            height: "100%",
            marginTop: theme.spacing(7),
            marginBottom: theme.spacing(1),
            marginLeft: theme.spacing(33),
            marginRight: theme.spacing(1),

            backgroundColor: theme.palette.background.default,
            borderRadius: theme.shape.borderRadius,
          })}
        >
          <TabbedView childClassName="grid-tabs" labels={["Tables"]}>
            <MeasurementDashboard />

            <></>
          </TabbedView>
        </Box>
      </Box>
    </ErrorBoundary>
  );
};
