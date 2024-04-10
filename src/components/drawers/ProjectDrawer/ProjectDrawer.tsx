import React from "react";

import { AppBarOffset, DividerHeader } from "components/styled-components";
import { BaseAppDrawer } from "../BaseAppDrawer";
import { FileList } from "components/lists";
import { CategoriesList } from "components/lists";
import { ModelTaskSection } from "./ModelTaskSection";

export const ProjectDrawer = () => {
  return (
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
