import React from "react";
import { Divider, useTheme, Box } from "@mui/material";

import { ZoomOptions, SelectionOptions, ColorOptions } from "../tool-options";

export const SideToolBar = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        gridArea: "side-tools",
        position: "relative",
      }}
    >
      <Divider />
      <SelectionOptions />
      <Divider />

      <ZoomOptions />

      <Divider />
      <ColorOptions />
    </Box>
  );
};
