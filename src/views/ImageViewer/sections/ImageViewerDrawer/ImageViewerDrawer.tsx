import { Box, Drawer, Stack } from "@mui/material";

import { useDrawerViewComponent } from "@ImageViewer/contexts/DrawerActionProvider";

import { DIMENSIONS } from "utils/constants";

export const ImageViewerDrawer = () => {
  const drawViewComponent = useDrawerViewComponent();

  return (
    <Box
      sx={{
        display: "flex",
        flexGrow: 1,
        minHeight: 0,
        gridArea: "action-drawer",
        maxHeight: `calc(100vh - ${DIMENSIONS.toolDrawerWidth}px)`,
        overflowY: "hidden",
      }}
    >
      <Drawer
        anchor="left"
        sx={{
          flexShrink: 0,
          width: DIMENSIONS.leftDrawerWidth,
          overflow: "hidden",
          "& > 	.MuiDrawer-paper": {
            zIndex: 99,
            width: DIMENSIONS.leftDrawerWidth,
            height: "100%",
            overflow: "hidden",
            position: "relative",
          },
        }}
        open
        variant="persistent"
      >
        <Stack
          sx={{
            position: "relative",
            height: "100%",
            minHeight: 0,
            overflow: "hidden",
          }}
          justifyContent={"space-between"}
        >
          {drawViewComponent}
        </Stack>
      </Drawer>
    </Box>
  );
};
