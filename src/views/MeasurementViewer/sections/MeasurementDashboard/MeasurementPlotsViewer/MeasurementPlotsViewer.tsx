import { useMemo } from "react";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useDispatch, useSelector } from "react-redux";

import { Box, Typography } from "@mui/material";

import { CustomTabs } from "@MeasurementViewer/components/custom-tab-switcher";
import {
  selectActiveMeasuredEntities,
  selectPlotData,
} from "@MeasurementViewer/state/reselectors";
import {
  selectActivePlotIds,
  selectActiveSelectedPlot,
  selectRenderPlotName,
} from "@MeasurementViewer/state/selectors";
import { measurementsSlice } from "@MeasurementViewer/state";
import { ChartType } from "@MeasurementViewer/types";

import {
  ResponsiveBarHistogram,
  ResponsiveScatter,
  ResponsiveSwarm,
} from "./plots";
import { MeasurementPlot } from "./MeasurementPlot";
import {
  BaseConfig,
  HistogramConfig,
  ScatterConfig,
  SwarmConfig,
} from "./PlotConfigs";

export const MeasurementPlotsViewer = () => {
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

  const renderedPlot = useMemo(() => {
    switch (selectedPlot.chartConfig.chart) {
      case ChartType.Histogram:
        return (
          <MeasurementPlot>
            <ResponsiveBarHistogram
              measurementData={measurementData}
              chartConfig={selectedPlot.chartConfig}
              entityIds={activeEntityIds}
            />
          </MeasurementPlot>
        );

      case ChartType.Scatter:
        return (
          <MeasurementPlot>
            <ResponsiveScatter
              measurementData={measurementData}
              chartConfig={selectedPlot.chartConfig}
              thingIds={activeEntityIds}
            />
          </MeasurementPlot>
        );

      case ChartType.Swarm:
        return (
          <MeasurementPlot>
            <ResponsiveSwarm
              measurementData={measurementData}
              chartConfig={selectedPlot.chartConfig}
              thingIds={activeEntityIds}
            />
          </MeasurementPlot>
        );
    }
  }, [measurementData, activeEntityIds, selectedPlot.chartConfig]);

  const renderedConfigOptions = useMemo(() => {
    switch (selectedPlot.chartConfig.chart) {
      case ChartType.Histogram:
        return <HistogramConfig />;
      case ChartType.Scatter:
        return <ScatterConfig />;
      case ChartType.Swarm:
        return <SwarmConfig />;
    }
  }, [selectedPlot.chartConfig.chart]);

  return (
    <Box
      data-id="plotsContainer"
      width="100%"
      display="flex"
      height="100%"
      flexDirection="row"
    >
      <PanelGroup direction="horizontal">
        <>
          {/* Plot Option Configuration */}
          <Panel id="sidebar" defaultSize={20}>
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
                <Typography
                  variant="h6"
                  sx={{ px: 1, py: 0.5, fontSize: "1rem" }}
                >
                  Plot Config
                </Typography>
              </Box>
              <Box
                sx={(theme) => ({
                  pl: 1,
                  pb: 1,
                  bgcolor:
                    theme.palette.background.paper.slice(0, -1) + ",0.7)",
                  overflowY: "scroll",
                  flexGrow: 1,
                })}
              >
                <BaseConfig />
                {renderedConfigOptions}
              </Box>
            </Box>
          </Panel>

          <PanelResizeHandle
            style={{
              width: "8px",
              //backgroundColor: theme.palette.background.paper,
            }}
          />
        </>
        {/* Plot Switcher/Renderer */}
        <Panel id="plot" defaultSize={80}>
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
              {renderedPlot}
            </CustomTabs>
          </Box>
        </Panel>
      </PanelGroup>
    </Box>
  );
};
