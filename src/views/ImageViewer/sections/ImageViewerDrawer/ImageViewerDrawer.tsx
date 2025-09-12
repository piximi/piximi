import React from "react";
import { Box } from "@mui/material";

import { BaseAppDrawer } from "components/layout";

import { useDrawerViewComponent } from "views/ImageViewer/state/DrawerViewContext";

export const ImageViewerDrawer = () => {
  const drawViewComponent = useDrawerViewComponent();

  return (
    <Box
      sx={{
        display: "flex",
        flexGrow: 1,
        gridArea: "action-drawer",
      }}
    >
      <BaseAppDrawer hideSettings={true}>{drawViewComponent}</BaseAppDrawer>
    </Box>
  );
};
