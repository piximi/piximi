import { useRef } from "react";

import { useSelector } from "react-redux";

import { Box, Button } from "@mui/material";

import { selectActiveSelectedPlot } from "@MeasurementViewer/state/selectors";
import { savePlot } from "@MeasurementViewer/utils";

import type { ReactNode } from "react";

export const MeasurementPlot = ({ children }: { children: ReactNode }) => {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  if (!selectedPlot) return <></>;

  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        bgcolor: theme.palette.background.paper.slice(0, -1) + ",0.7)",
      })}
    >
      <Box
        data-doc="plot-canvas"
        ref={plotRef}
        sx={{
          width: "100%",
          height: "90%",
        }}
      >
        {children}
      </Box>
      <Button
        data-doc="save-plot"
        variant="text"
        sx={{ alignSelf: "flex-end", mr: 1 }}
        onClick={() => savePlot(plotRef, selectedPlot.name)}
      >
        Save to PNG
      </Button>
    </Box>
  );
};
