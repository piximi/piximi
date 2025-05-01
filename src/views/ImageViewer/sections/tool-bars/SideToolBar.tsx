import React from "react";
import { Divider, useTheme, Box } from "@mui/material";

import { CreationOptions, ToolOptions } from "./tools";
import { dimensions } from "utils/constants";

export const SideToolBar = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderLeft: `1px solid ${theme.palette.divider}`,
        gridArea: "side-tools",
        position: "relative",
        width: dimensions.toolDrawerWidth,
        zIndex: 1002,
      }}
    >
      <CreationOptions />
      <Divider />
      <ToolOptions />
    </Box>
  );
};
