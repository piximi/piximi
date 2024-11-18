import React from "react";

import { AppBarOffset } from "components/AppBarOffset";
import { DividerHeader } from "components/DividerHeader";
import { BaseAppDrawer } from "components/BaseAppDrawer";
import { FileIO } from "sections/FileIO";
import { ModelTaskSection } from "../../ModelTaskSection/ModelTaskSection";
import { useMobileView } from "hooks";
import { CategoriesSection } from "sections/CategoriesSection";

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
      <CategoriesSection />
    </BaseAppDrawer>
  );
};
