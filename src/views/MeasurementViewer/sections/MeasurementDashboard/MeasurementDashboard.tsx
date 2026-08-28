import type React from "react";
import { useState } from "react";

import { Box } from "@mui/material";
import { useGridApiRef } from "@mui/x-data-grid";

import { TextToggleButton, TextToggleButtonGroup } from "components/inputs";

import { MeasurementPlotsViewer } from "./MeasurementPlotsViewer";
import { ExportButton } from "./ExportDataButton";
import { MeasurementTableViewer } from "./MeasurementTableViewer";

export const MeasurementDashboard = () => {
  const [view, setView] = useState<"table" | "plots">("table");
  const gridApiRef = useGridApiRef();
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: string,
  ) => {
    if (newView !== null) setView(newView as "table" | "plots");
  };
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        p: 2,
        gap: 1,
        width: "100%",
        height: "100%",
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box sx={{ flex: 1 }} />
        <TextToggleButtonGroup
          color="primary"
          value={view}
          exclusive
          onChange={handleChange}
          size="small"
        >
          <TextToggleButton value="table">Table View</TextToggleButton>
          <TextToggleButton value="plots">Plot View</TextToggleButton>
        </TextToggleButtonGroup>
        <Box sx={{ display: "flex", flex: 1, justifyContent: "flex-end" }}>
          <ExportButton view={view} gridApiRef={gridApiRef} />
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
        {view === "table" ? (
          <MeasurementTableViewer gridApiRef={gridApiRef} />
        ) : (
          <MeasurementPlotsViewer />
        )}
      </Box>
    </Box>
  );
};
