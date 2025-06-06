import React from "react";
import { Divider, useTheme, Box } from "@mui/material";

import { CreationOptions, ToolOptions } from "./tools";
import { DIMENSIONS } from "utils/constants";

export const SideToolBar = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        gridArea: "side-tools",
        position: "relative",
        width: DIMENSIONS.toolDrawerWidth,
        zIndex: 1002,
      }}
    >
      <CreationOptions />
      <Divider />
      <ToolOptions />
    </Box>
  );
};
