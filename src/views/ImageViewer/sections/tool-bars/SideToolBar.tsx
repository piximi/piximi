import React from "react";
import { Divider, useTheme, Box } from "@mui/material";

import { CreationOptions, ToolOptions } from "./tools";
import { DIMENSIONS } from "utils/constants";
import { useSelector } from "react-redux";
import { selectTrackletView } from "views/ImageViewer/state/imageViewer/selectors";

export const SideToolBar = () => {
  const theme = useTheme();
  const trackletView = useSelector(selectTrackletView);

  return trackletView ? (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        gridArea: "side-tools",
        position: "relative",
        width: DIMENSIONS.toolDrawerWidth,
        zIndex: 1002,
      }}
    ></Box>
  ) : (
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
