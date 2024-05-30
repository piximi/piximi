import React from "react";
import { useDispatch } from "react-redux";
import { Box, Button } from "@mui/material";
import { applicationSettingsSlice } from "store/applicationSettings";
import { useNavigate } from "react-router-dom";
import { HotkeyView } from "utils/common/enums";

export const MeasurementOptions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleNavigateMeasurements = () => {
    dispatch(
      applicationSettingsSlice.actions.unregisterHotkeyView({
        hotkeyView: HotkeyView.MainImageGridAppBar,
      })
    );
    navigate("/measurements");
  };
  return (
    <Box display="flex" justifyContent="center">
      <Button variant="text" onClick={handleNavigateMeasurements}>
        Go to measurements
      </Button>
    </Box>
  );
};
