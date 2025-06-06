import React, { useEffect } from "react";
import { ErrorBoundary, useErrorHandler } from "react-error-boundary";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import { useUnloadConfirmation } from "hooks";

import { FallbackDialog } from "components/dialogs";

import { MeasurementDashboard, MeasurementsDrawer } from "./sections";

import { selectProjectImageChannels } from "store/project/selectors";
import { applicationSettingsSlice } from "store/applicationSettings";
import { measurementsSlice } from "store/measurements/measurementsSlice";

import { DIMENSIONS } from "utils/constants";
import { HotkeyContext } from "utils/enums";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { ArrowBack } from "@mui/icons-material";
import { LogoLoader } from "components/ui";
import { useNavigate } from "react-router-dom";

export const MeasurementView = () => {
  const dispatch = useDispatch();
  const projectImageChannels = useSelector(selectProjectImageChannels);

  useErrorHandler();
  useUnloadConfirmation();

  useEffect(() => {
    dispatch(
      applicationSettingsSlice.actions.registerHotkeyContext({
        context: HotkeyContext.MeasurementsView,
      }),
    );
    return () => {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: HotkeyContext.MeasurementsView,
        }),
      );
    };
  }, [dispatch]);

  useEffect(() => {
    if (projectImageChannels) {
      dispatch(
        measurementsSlice.actions.updateChannelOptions({
          numChannels: projectImageChannels,
        }),
      );
    }
  }, [projectImageChannels, dispatch]);

  return (
    <ErrorBoundary FallbackComponent={FallbackDialog}>
      <Box
        sx={{
          height: "100vh",
          display: "grid",
          gridTemplateColumns: `${DIMENSIONS.leftDrawerWidth}px 1fr ${DIMENSIONS.toolDrawerWidth}px`,
          gridTemplateRows: `${DIMENSIONS.toolDrawerWidth}px 1fr`,
          gridTemplateAreas:
            '"top-bar top-bar top-bar"  "action-drawer dashboard side-bar"',
        }}
      >
        <TempTopBar />
        <MeasurementsDrawer />

        <Box
          sx={(theme) => ({
            maxHeight: "100vh",
            gridArea: "dashboard",
            overflow: "hidden",
            flexGrow: 1,
            height: "100%",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "4px 4px 0 0",

            backgroundColor: theme.palette.background.default,
          })}
        >
          <MeasurementDashboard />
        </Box>
        <TempSideBar />
      </Box>
    </ErrorBoundary>
  );
};

export const TempSideBar = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        gridArea: "side-bar",
        position: "relative",
        width: DIMENSIONS.toolDrawerWidth,
        zIndex: 1002,
      }}
    ></Box>
  );
};

export const TempTopBar = () => {
  return (
    <Stack
      direction="row"
      justifyContent="flex-start"
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        gridArea: "top-bar",
        height: DIMENSIONS.toolDrawerWidth,
        overflowY: "visible",
        zIndex: 1002,
      })}
    >
      <MeasurementsLogo />
    </Stack>
  );
};

export const MeasurementsLogo = () => {
  const navigate = useNavigate();

  const onReturnToMainProject = () => {
    navigate("/project");
  };

  return (
    <Box sx={{ pl: 1, display: "flex", alignItems: "center" }}>
      <Tooltip title="Return to project" placement="bottom">
        <IconButton
          data-help={HelpItem.NavigateProjectView}
          edge="start"
          onClick={onReturnToMainProject}
          aria-label="Exit Measurements"
          href={""}
        >
          <ArrowBack />
        </IconButton>
      </Tooltip>
      <LogoLoader width={24} height={24} loadPercent={1} fullLogo={false} />
      <Typography variant="h5" color={"#02aec5"} fontSize="1.4rem">
        Measurements
      </Typography>
    </Box>
  );
};
