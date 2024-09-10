import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import { selectPlotData } from "store/measurements/reselectors";
import { CustomTabs } from "components/styled-components";
import { useCallback } from "react";
import { useMeasurementParameters, usePlotControl } from "../providers/hooks";
import {
  ResponsiveHistogram,
  ResponsiveScatter,
  ResponsiveSwarm,
} from "../plots";
import { ChartConfig, ChartType } from "../types";

export const PlotContainer = () => {
  const measurementData = useSelector(selectPlotData);
  const { groupThingIds } = useMeasurementParameters();
  const {
    plotDetails,
    selectedPlot,
    addPlot,
    editPlot,
    removePlot,
    plotTabLabels,
    setActiveLabel,
    renderLabel,
  } = usePlotControl();

  const renderPlot = useCallback(
    (config: ChartConfig) => {
      switch (config.chart) {
        case ChartType.Histogram:
          return (
            <ResponsiveHistogram
              measurementData={measurementData}
              chartConfig={config}
              thingIds={groupThingIds}
            />
          );
        case ChartType.Scatter:
          return (
            <ResponsiveScatter
              measurementData={measurementData}
              chartConfig={config}
              thingIds={groupThingIds}
            />
          );

        case ChartType.Swarm:
          return (
            <ResponsiveSwarm
              measurementData={measurementData}
              chartConfig={config}
              thingIds={groupThingIds}
            />
          );
      }
    },
    [measurementData, groupThingIds]
  );

  return (
    <Box
      height="100%"
      width="100%"
      sx={(theme) => ({
        borderLeft: `1px solid ${theme.palette.divider}`,
      })}
    >
      <CustomTabs
        childClassName="measurement-plots"
        labels={plotTabLabels}
        secondaryEffect={setActiveLabel}
        activeLabel={plotDetails.selectedPlot}
        transition="controlled"
        renderLabel={renderLabel}
        extendable
        editable
        handleTabEdit={editPlot}
        handleNew={addPlot}
        handleTabClose={removePlot}
      >
        {renderPlot(selectedPlot.chartConfig)}
      </CustomTabs>
    </Box>
  );
};
