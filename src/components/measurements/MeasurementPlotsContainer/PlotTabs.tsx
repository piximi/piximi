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
import { PlotContainer } from "../plots/PlotContainer";

export const PlotTabs = () => {
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
      let plot: JSX.Element;
      switch (config.chart) {
        case ChartType.Histogram:
          plot = (
            <ResponsiveHistogram
              measurementData={measurementData}
              chartConfig={config}
              thingIds={groupThingIds}
            />
          );
          break;
        case ChartType.Scatter:
          plot = (
            <ResponsiveScatter
              measurementData={measurementData}
              chartConfig={config}
              thingIds={groupThingIds}
            />
          );
          break;

        case ChartType.Swarm:
          plot = (
            <ResponsiveSwarm
              measurementData={measurementData}
              chartConfig={config}
              thingIds={groupThingIds}
            />
          );
          break;
      }
      return <PlotContainer>{plot}</PlotContainer>;
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
