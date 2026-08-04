import React from "react";

import { BaseAppDrawer } from "components/layout";
import { MeasurementGroupOptionsContainer } from "../MeasurementGroupOptionsContainer";
import { Box } from "@mui/material";

export const MeasurementsDrawer = () => {
  return (
    <Box sx={{ display: "flex", flexGrow: 1, gridArea: "action-drawer" }}>
      <BaseAppDrawer>
        <MeasurementGroupOptionsContainer />
      </BaseAppDrawer>
    </Box>
  );
};
