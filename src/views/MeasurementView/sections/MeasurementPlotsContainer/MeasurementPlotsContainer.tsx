import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Box } from "@mui/material";

import { PlotControls } from "./PlotControls";
import { PlotTabs } from "./PlotTabs";

export const MeasurementPlotsContainer = () => {
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
          <Panel id="sidebar" defaultSize={20}>
            <PlotControls />
          </Panel>

          <PanelResizeHandle
            style={{
              width: "8px",
              //backgroundColor: theme.palette.background.paper,
            }}
          />
        </>
        <Panel id="plot" defaultSize={80}>
          <PlotTabs />
        </Panel>
      </PanelGroup>
    </Box>
  );
};
