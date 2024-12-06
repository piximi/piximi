import React from "react";

import { useMobileView } from "hooks";

import { AppBarOffset } from "components/ui/AppBarOffset";
import { DividerHeader } from "components/ui/DividerHeader";
import { BaseAppDrawer } from "components/layout";
import { FileIO } from "components/file-io";
import { ProjectViewerCategories } from "../../components/ProjectViewerCategories";
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

      <DividerHeader sx={{ my: 1 }} textAlign="left" typographyVariant="body2">
        Categories
      </DividerHeader>
      <ProjectViewerCategories />
    </BaseAppDrawer>
  );
};
