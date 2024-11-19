import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";

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
