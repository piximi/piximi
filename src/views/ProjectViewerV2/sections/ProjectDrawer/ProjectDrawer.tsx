import React from "react";

import { useMobileView } from "hooks";

import { DividerHeader } from "components/ui";
import { BaseAppDrawer } from "components/layout";
import { ProjectViewerCategories, FileIO } from "../../components";
import { ModelTaskSection } from "../ModelTaskSection";
import { Box } from "@mui/material";

export const ProjectDrawer = () => {
  const isMobile = useMobileView();
  return isMobile ? (
    <></>
  ) : (
    <Box sx={{ display: "flex", flexGrow: 1, gridArea: "action-drawer" }}>
      <BaseAppDrawer>
        <FileIO />
        <DividerHeader
          sx={{ my: 1 }}
          textAlign="left"
          typographyVariant="body2"
        >
          Learning Task
        </DividerHeader>
        <ModelTaskSection />

        <ProjectViewerCategories />
      </BaseAppDrawer>
    </Box>
  );
};
