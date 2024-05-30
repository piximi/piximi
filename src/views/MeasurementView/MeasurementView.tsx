import React, { useEffect } from "react";
import { ErrorBoundary, useErrorHandler } from "react-error-boundary";
import { useDispatch, useSelector } from "react-redux";
import { Box, CssBaseline } from "@mui/material";
import { MeasurementDashboard } from "components/data-viz";
import { FallBackDialog } from "components/dialogs";
import { MeasurementsDrawer } from "components/drawers";
import { TabbedView } from "components/styled-components";
import { useUnloadConfirmation } from "hooks";

import { selectProjectImageChannels } from "store/project/selectors";
import { dimensions } from "utils/common/constants";
import { HotkeyView } from "utils/common/enums";
import { applicationSettingsSlice } from "store/applicationSettings";
import { measurementsSlice } from "store/measurements/measurementsSlice";

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

        <MeasurementsDrawer />

        <Box
          sx={(theme) => ({
            maxWidth: `calc(100% - ${
              dimensions.leftDrawerWidth
            }px - ${theme.spacing(2)})`,
            maxHeight: "100vh",
            overflow: "hidden",
            flexGrow: 1,
            height: "100%",
            marginLeft: theme.spacing(32),

            backgroundColor: theme.palette.background.default,
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
