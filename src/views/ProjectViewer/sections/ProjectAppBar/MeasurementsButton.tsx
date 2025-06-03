import React from "react";
import { useNavigate } from "react-router-dom";
import { Chip, Tooltip } from "@mui/material";
import { Straighten as StraightenIcon } from "@mui/icons-material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const MeasurementsButton = () => {
  const navigate = useNavigate();
  const handleNavigateMeasurements = () => {
    navigate("/measurements");
  };
  return (
    <Tooltip title="Go to Measurements">
      <span>
        <Chip
          data-help={HelpItem.NavigateMeasurements}
          avatar={<StraightenIcon color="inherit" />}
          label="Measurements"
          onClick={handleNavigateMeasurements}
          variant="outlined"
        />
      </span>
    </Tooltip>
  );
};
