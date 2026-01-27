import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";

import { CustomTabs } from "components/layout";
import {
  ResponsiveHistogram,
  ResponsiveScatter,
  ResponsiveSwarm,
  PlotContainer,
} from "../../plots";
import { measurementsSlice } from "views/MeasurementView/state/redux/measurementsSlice";
import {
  selectActivePlotIds,
  selectActiveSelectedPlot,
  selectRenderPlotName,
} from "views/MeasurementView/state/redux/selectors";
import {
  selectActiveMeasuredEntities,
  selectPlotData,
} from "../../state/redux/reselectors";
import { ChartConfig, ChartType } from "../../types";

export const PlotTabs = () => {
  const dispatch = useDispatch();
  const measurementData = useSelector(selectPlotData);
  const activeEntities = useSelector(selectActiveMeasuredEntities);
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  const activePlotIds = useSelector(selectActivePlotIds);
  const renderPlotName = useSelector(selectRenderPlotName);
  if (!selectedPlot) return <></>;

  const activeEntityIds = useMemo(() => {
    if (!activeEntities) return [];
    return Object.keys(activeEntities);
  }, [activeEntities]);

  const addPlot = () => {
    dispatch(measurementsSlice.actions.addActiveGroupPlot());
  };
  const editPlotName = (plotId: string, newName: string) => {
    dispatch(measurementsSlice.actions.editPlotName({ plotId, newName }));
  };
  const removePlot = (plotId: string) => {
    dispatch(measurementsSlice.actions.removePlot(plotId));
  };

  const selectPlot = (plotId: string) => {
    dispatch(measurementsSlice.actions.setActiveGroupPlotId(plotId));
  };

  const renderPlot = useCallback(
    (config: ChartConfig) => {
      let plot: JSX.Element;
      switch (config.chart) {
        case ChartType.Histogram:
          plot = (
            <ResponsiveHistogram
              measurementData={measurementData}
              chartConfig={config}
              entityIds={activeEntityIds}
            />
          );
          break;
        case ChartType.Scatter:
          plot = (
            <ResponsiveScatter
              measurementData={measurementData}
              chartConfig={config}
              thingIds={activeEntityIds}
            />
          );
          break;

        case ChartType.Swarm:
          plot = (
            <ResponsiveSwarm
              measurementData={measurementData}
              chartConfig={config}
              thingIds={activeEntityIds}
            />
          );
          break;
      }
      return <PlotContainer>{plot}</PlotContainer>;
    },
    [measurementData, activeEntityIds],
  );

  return (
    <Box
      height="100%"
      width="100%"
      sx={{
        border: `1px solid rgba(23, 23, 23, 1)`,
        borderRadius: 1,
      }}
    >
      <CustomTabs
        childClassName="measurement-plots"
        labels={activePlotIds}
        secondaryEffect={selectPlot}
        activeLabel={selectedPlot.id}
        transition="controlled"
        renderLabel={renderPlotName}
        extendable
        editable
        handleTabEdit={editPlotName}
        handleNew={addPlot}
        handleTabClose={removePlot}
      >
        {renderPlot(selectedPlot.chartConfig)}
      </CustomTabs>
    </Box>
  );
};
