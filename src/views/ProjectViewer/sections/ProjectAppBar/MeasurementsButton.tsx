import React from "react";
import { useNavigate } from "react-router-dom";
import { Chip, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import { Straighten as StraightenIcon } from "@mui/icons-material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const MeasurementsButton = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const smOrXsBreakpoint = useMediaQuery(theme.breakpoints.down("md"));
  const handleNavigateMeasurements = () => {
    navigate("/measurements");
  };
  return (
    <Tooltip title="Go to Measurements">
      <span>
        <Chip
          data-help={HelpItem.NavigateMeasurements}
          avatar={<StraightenIcon color="inherit" />}
          label={smOrXsBreakpoint ? "" : "Measure"}
          onClick={handleNavigateMeasurements}
          variant="outlined"
          size="small"
          sx={{ pl: smOrXsBreakpoint ? 1 : 0 }}
        />
      </span>
    </Tooltip>
  );
};
