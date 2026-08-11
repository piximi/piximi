import { Box, Stack } from "@mui/material";

import { useAnnotatorToolShortcuts } from "@ImageViewer/hooks";
import { ImageViewerLogo } from "@ImageViewer/components";

import { DIMENSIONS } from "utils/constants";

import { ZoomOptions } from "./tools";

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
          flexGrow: 1,
          justifyContent: "center",
          height: DIMENSIONS.toolDrawerWidth,
          overflowY: "visible",
          zIndex: 1002,
        })}
      >
        <ZoomOptions />
      </Box>
    </Stack>
  );
};
