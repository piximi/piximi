import React from "react";
import { Divider, useTheme, Box } from "@mui/material";

import { ZoomOptions, SelectionOptions, ColorOptions } from "./tools";

export const SideToolBar = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderLeft: `1px solid ${theme.palette.divider}`,
        gridArea: "side-tools",
        position: "relative",
      }}
    >
      <SelectionOptions />
      <Divider />

      <ZoomOptions />

      <Divider />
      <ColorOptions />
    </Box>
  );
};
