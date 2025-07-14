import React from "react";
import { Divider, Box, Stack } from "@mui/material";

import { useAnnotatorToolShortcuts } from "../../hooks";

import { DIMENSIONS } from "utils/constants";
import { SelectionOptions, ZoomOptions } from "./tools";
import { ImageViewerLogo } from "../ImageViewerAppBar/ImageViewerAppBar";

export const TopToolBar = () => {
  useAnnotatorToolShortcuts();

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        gridArea: "top-tools",
        height: DIMENSIONS.toolDrawerWidth,
        overflowY: "visible",
        zIndex: 1002,
      })}
    >
      <ImageViewerLogo />
      <Box
        sx={(theme) => ({
          backgroundColor: theme.palette.background.paper,
          position: "relative",
          display: "flex",
          justifyContent: "flex-end",
          justifyItems: "flex-end",
          height: DIMENSIONS.toolDrawerWidth,
          overflowY: "visible",
          zIndex: 1002,
        })}
      >
        <ZoomOptions />
        <Divider orientation="vertical" flexItem />
        <SelectionOptions />
      </Box>
    </Stack>
  );
};
