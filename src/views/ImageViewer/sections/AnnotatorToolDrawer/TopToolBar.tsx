import React from "react";
import { Divider, Box } from "@mui/material";

import { useAnnotatorToolShortcuts } from "../../hooks";

import { dimensions } from "utils/common/constants";
import { CreationOptions, ToolOptions } from "../tool-options";

export const TopToolBar = () => {
  useAnnotatorToolShortcuts();

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        gridArea: "top-tools",
        display: "flex",
        justifyContent: "flex-end",
        justifyItems: "flex-end",
        height: dimensions.toolDrawerWidth,
        overflowY: "visible",
        zIndex: 1002,
      })}
    >
      <CreationOptions />
      <Divider orientation="vertical" flexItem />
      <ToolOptions />
    </Box>
  );
};
