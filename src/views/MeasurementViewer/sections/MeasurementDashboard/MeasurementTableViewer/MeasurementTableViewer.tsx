import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { Box } from "@mui/material";
import type { GridApiCommunity } from "@mui/x-data-grid/internals";

import { SplitOptions } from "./pivot-table/SplitOptions";
import { PivotTable } from "./pivot-table/PivotTable";

export const MeasurementTableViewer = ({
  gridApiRef,
}: {
  gridApiRef: React.MutableRefObject<GridApiCommunity | null>;
}) => {
  return (
    <Box
      data-id="measurementTable"
      sx={{
        display: "flex",
        maxWidth: "100%",
        width: "100%",
        height: "100%",
        maxHeight: "100%",
        minHeight: 0, // ← Add this
        overflow: "hidden", // ← Add this
      }}
    >
      <PanelGroup direction="horizontal">
        <>
          <Panel id="sidebar" defaultSize={20}>
            {/* <SplitTree table={table} /> */}
            <SplitOptions />
          </Panel>

          <PanelResizeHandle
            style={{
              width: "8px",
            }}
          />
        </>
        <Panel id="plot" defaultSize={80}>
          <PivotTable gridApiRef={gridApiRef} />
        </Panel>
      </PanelGroup>
    </Box>
  );
};
