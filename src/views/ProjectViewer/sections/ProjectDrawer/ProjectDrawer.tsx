import React from "react";

import { useMobileView } from "hooks";

import { AppBarOffset, DividerHeader } from "components/ui";
import { BaseAppDrawer } from "components/layout";
import { ProjectViewerCategories, FileIO } from "../../components";
import { ModelTaskSection } from "../ModelTaskSection";

export const ProjectDrawer = () => {
  const isMobile = useMobileView();
  return isMobile ? (
    <></>
  ) : (
    <BaseAppDrawer>
      <AppBarOffset />

      <FileIO />
      <DividerHeader sx={{ my: 1 }} textAlign="left" typographyVariant="body2">
        Learning Task
      </DividerHeader>
      <ModelTaskSection />

      <ProjectViewerCategories />
    </BaseAppDrawer>
  );
};
