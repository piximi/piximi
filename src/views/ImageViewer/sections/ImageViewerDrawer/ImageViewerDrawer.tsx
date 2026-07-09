import { Box } from "@mui/material";

import { BaseAppDrawer } from "components/layout";

import { useDrawerViewComponent } from "@ImageViewer/contexts/DrawerActionProvider";

import { DIMENSIONS } from "utils/constants";

export const ImageViewerDrawer = () => {
  const drawViewComponent = useDrawerViewComponent();

  return (
    <Box
      sx={{
        display: "flex",
        flexGrow: 1,
        gridArea: "action-drawer",
        maxHeight: `calc(100vh - ${DIMENSIONS.toolDrawerWidth})`,
        overflowY: "hidden",
      }}
    >
      <BaseAppDrawer hideSettings={true}>{drawViewComponent}</BaseAppDrawer>
    </Box>
  );
};
