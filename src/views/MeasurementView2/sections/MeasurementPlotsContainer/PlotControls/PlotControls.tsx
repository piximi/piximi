import { Box, Typography } from "@mui/material";
import { useCallback } from "react";
import {
  HistogramOptions,
  ScatterOptions,
  SwarmOptions,
} from "./ControlOptions";
import { ColorThemeSelect, PlotSelect } from "./ControlInputs";

import { ChartType } from "../../../types";
import { useSelector } from "react-redux";
import { selectActiveSelectedPlot } from "views/MeasurementView2/state/redux/selectors";

export const PlotControls = () => {
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  if (!selectedPlot) return <></>;
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
      sx={{
        display: "flex",
        flexDirection: "column",
        border: `1px solid rgba(23, 23, 23, 1)`,
        borderRadius: 1,
      }}
    >
      <Box sx={{ height: "46px", pt: 1 }}>
        <Typography variant="h6" sx={{ px: 1, py: 0.5, fontSize: "1rem" }}>
          Plot Options
        </Typography>
      </Box>
      <Box
        sx={(theme) => ({
          pl: 1,
          pb: 1,
          bgcolor: theme.palette.background.paper.slice(0, -1) + ",0.7)",
          overflowY: "scroll",
          flexGrow: 1,
        })}
      >
        <PlotSelect selectedPlot={selectedPlot} />
        <ColorThemeSelect selectedPlot={selectedPlot} />
        {renderOptions(selectedPlot.chartConfig.chart)}
      </Box>
    </Box>
  );
};
