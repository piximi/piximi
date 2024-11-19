import React from "react";

import { useMobileView } from "hooks";

import { AppBarOffset } from "components/AppBarOffset";
import { DividerHeader } from "components/DividerHeader";
import { BaseAppDrawer } from "components/BaseAppDrawer";
import { FileIO } from "sections/file-io";
import { ProjectViewerCategories } from "sections/categories";
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
