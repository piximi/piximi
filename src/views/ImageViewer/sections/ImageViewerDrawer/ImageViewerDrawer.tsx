import React, { useMemo, useState } from "react";
import { Box, IconButton, Stack } from "@mui/material";
import {
  DownloadOutlined as DownloadIcon,
  LabelOutlined as LabelIcon,
  ImageOutlined as ImageIcon,
  FormatShapes as FormatShapesIcon,
} from "@mui/icons-material";

import { BaseAppDrawer } from "components/layout";

//import { selectCreatedAnnotationCategories } from "store/slices/data";
import { AnnotationSection } from "./annotation-section/AnnotationSection";
import { DIMENSIONS } from "utils/constants";
import { ExportAnnotationsSection } from "./ExportAnnotationsSection";
import { KindCategorySection } from "./KindCategorySection";
import { ImageList } from "./ImageList";
import { SettingsButton } from "components/layout/app-drawer/application-settings/SettingsButton";
import { SendFeedbackButton } from "components/layout/app-drawer/SendFeedbackButton";
import { HelpButton } from "components/layout/app-drawer/HelpButton";

type DrawerContextType = "export" | "images" | "categories" | "annotations";
export const ImageViewerDrawer = () => {
  const [drawerContext, setDrawerContext] =
    useState<DrawerContextType>("images");

  const DrawerContextComponent = useMemo(() => {
    switch (drawerContext) {
      case "export":
        return <ExportAnnotationsSection />;
      case "images":
        return <ImageList />;
      case "categories":
        return <KindCategorySection />;
      case "annotations":
        return <AnnotationSection />;
    }
  }, [drawerContext]);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `${DIMENSIONS.toolDrawerWidth}px 1fr`,
        flexGrow: 1,
        gridArea: "action-drawer",
      }}
    >
      <Stack
        sx={(theme) => ({
          bgcolor: theme.palette.background.paper,
          //borderRight: `1px solid ${theme.palette.divider}`,
          height: "100%",
          justifyContent: "space-between",
        })}
      >
        <Stack>
          <IconButton onClick={() => setDrawerContext("export")}>
            <DownloadIcon />
          </IconButton>
          <IconButton onClick={() => setDrawerContext("images")}>
            <ImageIcon />
          </IconButton>
          <IconButton onClick={() => setDrawerContext("categories")}>
            <LabelIcon />
          </IconButton>
          <IconButton onClick={() => setDrawerContext("annotations")}>
            <FormatShapesIcon />
          </IconButton>
        </Stack>

        <Stack
          sx={{ position: "relative", bottom: 0 }}
          direction="column"
          justifyContent="space-evenly"
        >
          <SettingsButton />

          <SendFeedbackButton />

          <HelpButton />
        </Stack>
      </Stack>
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <BaseAppDrawer hideSettings={true}>
          {DrawerContextComponent}
        </BaseAppDrawer>
      </Box>
    </Box>
  );
};
