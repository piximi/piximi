import React from "react";

import { AppBarOffset, DividerHeader } from "components/styled-components";
import { BaseAppDrawer } from "../BaseAppDrawer";
import { FileListNew } from "components/lists/FileList/FileListNew";
import { CategoriesListNew } from "components/lists/CategoriesList/CategoriesListNew";
import { ModelTaskSection } from "./ModelTaskSection";

export const ProjectDrawerNew = () => {
  return (
    <BaseAppDrawer>
      <AppBarOffset />

      <FileListNew />
      <DividerHeader sx={{ my: 1 }} textAlign="left" typographyVariant="body2">
        Learning Task
      </DividerHeader>
      <ModelTaskSection />

      <DividerHeader sx={{ my: 1 }} textAlign="left" typographyVariant="body2">
        Categories
      </DividerHeader>
      <CategoriesListNew />
    </BaseAppDrawer>
  );
};
