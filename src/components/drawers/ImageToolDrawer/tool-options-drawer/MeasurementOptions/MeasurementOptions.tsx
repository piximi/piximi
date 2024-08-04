import React from "react";

import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const MeasurementOptions = () => {
  const navigate = useNavigate();
  const handleNavigateMeasurements = () => {
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
