import React from "react";
import { Box, useTheme } from "@mui/material";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { PlotControls } from "./PlotControls";
import { PlotTabs } from "./PlotTabs";

import { MeasurementsProvider } from "../../providers/MeasurementsProvider";

import { GroupedMeasurementDisplayTable } from "store/measurements/types";

export const MeasurementPlotsContainer = ({
  measurementGroup,
}: {
  measurementGroup: GroupedMeasurementDisplayTable;
}) => {
  const theme = useTheme();
  return (
    <MeasurementsProvider measurementGroup={measurementGroup}>
      <Box width="100%" display="flex" height="100%" flexDirection="row">
        <PanelGroup direction="horizontal">
          <>
            <Panel id="sidebar" defaultSize={30}>
              <PlotControls />
            </Panel>

            <PanelResizeHandle
              style={{
                width: "8px",
                backgroundColor: theme.palette.background.paper,
              }}
            />
          </>
          <Panel id="plot" defaultSize={70}>
            <PlotTabs />
          </Panel>
        </PanelGroup>
      </Box>
    </MeasurementsProvider>
  );
};
