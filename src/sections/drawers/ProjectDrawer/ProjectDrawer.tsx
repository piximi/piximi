import React from "react";

import { AppBarOffset } from "components/AppBarOffset";
import { DividerHeader } from "components/DividerHeader";
import { BaseAppDrawer } from "../../../components/BaseAppDrawer";
import { FileList } from "sections/lists";
import { CategoriesList } from "sections/lists";
import { ModelTaskSection } from "./ModelTaskSection";
import { useMobileView } from "hooks";

export const ProjectDrawer = () => {
  const isMobile = useMobileView();
  return isMobile ? (
    <></>
  ) : (
    <BaseAppDrawer>
      <AppBarOffset />

      <FileList />
      <DividerHeader sx={{ my: 1 }} textAlign="left" typographyVariant="body2">
        Learning Task
      </DividerHeader>
      <ModelTaskSection />

      <DividerHeader sx={{ my: 1 }} textAlign="left" typographyVariant="body2">
        Categories
      </DividerHeader>
      <CategoriesList />
    </BaseAppDrawer>
  );
};
