import type { ReactNode } from "react";
import React, { useRef } from "react";

import { useSelector } from "react-redux";

import { Box, Button } from "@mui/material";

import { selectActiveSelectedPlot } from "@MeasurementViewer/state/selectors";
import { savePlot } from "@MeasurementViewer/utils";

export const MeasurementPlot = ({ children }: { children: ReactNode }) => {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  if (!selectedPlot) return <></>;

  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      height="100%"
      sx={(theme) => ({
        bgcolor: theme.palette.background.paper.slice(0, -1) + ",0.7)",
      })}
    >
      <Box width="100%" height="90%" ref={plotRef}>
        {children}
      </Box>
      <Button
        variant="text"
        sx={{ alignSelf: "flex-end", mr: 1 }}
        onClick={() => savePlot(plotRef, selectedPlot.name)}
      >
        Save to PNG
      </Button>
    </Box>
  );
};
