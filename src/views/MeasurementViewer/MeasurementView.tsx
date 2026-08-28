import { useEffect } from "react";

import { ErrorBoundary, useErrorHandler } from "react-error-boundary";
import { useDispatch } from "react-redux";

import { Box } from "@mui/material";

import { useUnloadConfirmation } from "hooks";

import { FallbackDialog } from "components/dialogs";

import { applicationSettingsSlice } from "store/applicationSettings";

import { DIMENSIONS } from "utils/constants";
import { HotkeyContext } from "utils/enums";

import { MeasurementDashboardSwitcher, MeasurementsDrawer } from "./sections";
import { MeasurementsTopBar } from "./components/MeasurementsTopBar";
import { MeasurementsSideBar } from "./components/MeasurementsSideBar";

export const MeasurementView = () => {
  const dispatch = useDispatch();

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

  return (
    <ErrorBoundary FallbackComponent={FallbackDialog}>
      <Box
        sx={{
          height: "100vh",
          width: "100vw",
          display: "grid",
          gridTemplateColumns: `${DIMENSIONS.leftDrawerWidth}px 1fr ${DIMENSIONS.toolDrawerWidth}px`,
          gridTemplateRows: `${DIMENSIONS.toolDrawerWidth}px 1fr`,
          gridTemplateAreas:
            '"top-bar top-bar top-bar"  "action-drawer dashboard side-bar"',
        }}
      >
        <MeasurementsTopBar />
        <MeasurementsDrawer />
        <MeasurementDashboardSwitcher />
        <MeasurementsSideBar />
      </Box>
    </ErrorBoundary>
  );
};
