import React from "react";
import { Divider, Box } from "@mui/material";

import { useAnnotatorToolShortcuts } from "../../hooks";

import { dimensions } from "utils/constants";
import { ColorOptions, SelectionOptions, ZoomOptions } from "./tools";

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
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <ZoomOptions />
      <Divider orientation="vertical" flexItem />
      <ColorOptions />
      <Divider orientation="vertical" flexItem />
      <SelectionOptions />
    </Box>
  );
};
