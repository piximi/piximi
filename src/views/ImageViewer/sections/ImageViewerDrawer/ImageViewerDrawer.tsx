import { useMemo } from "react";

import { Box, Drawer, Stack } from "@mui/material";

import { DIMENSIONS } from "utils/constants";

import { useDrawerContext } from "@ImageViewer/contexts/DrawerActionProvider";

import { ImageSection } from "./ImageSection";
import { AnnotationSection } from "./AnnotationSection";

export const ImageViewerDrawer = () => {
  const { drawerContext } = useDrawerContext();
  const drawerViewComponent = useMemo(() => {
    switch (drawerContext) {
      case "images":
        return <ImageSection />;
      case "annotations":
        return <AnnotationSection />;
    }
  }, [drawerContext]);

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
            borderRight: "none",
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
          {drawerViewComponent}
        </Stack>
      </Drawer>
    </Box>
  );
};
