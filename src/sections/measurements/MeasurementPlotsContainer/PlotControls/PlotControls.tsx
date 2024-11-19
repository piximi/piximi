import { Box } from "@mui/material";
import { useCallback } from "react";
import {
  HistogramOptions,
  ScatterOptions,
  SwarmOptions,
} from "./ControlOptions";
import { ColorThemeSelect, PlotSelect } from "./ControlInputs";

import { usePlotControl } from "sections/measurements/providers/hooks";
import { ChartType } from "sections/measurements/types";

export const PlotControls = () => {
  const { selectedPlot } = usePlotControl();
  const renderOptions = useCallback((plot: ChartType) => {
    switch (plot) {
      case ChartType.Histogram:
        return <HistogramOptions />;
      case ChartType.Scatter:
        return <ScatterOptions />;
      case ChartType.Swarm:
        return <SwarmOptions />;
    }
  }, []);

  return (
    <Box
      width={"100%"}
      height="100%"
      p={1}
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        overflowY: "scroll",
      })}
    >
      <Box sx={{ pl: 1, pb: 1 }}>
        <PlotSelect />
        <ColorThemeSelect />
        {renderOptions(selectedPlot.chartConfig.chart)}
      </Box>
    </Box>
  );
};
