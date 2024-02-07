import React from "react";

import { Divider } from "@mui/material";

import {
  AppBarOffset,
  CustomTabSwitcher,
  DividerHeader,
} from "components/styled-components";
import { BaseAppDrawer } from "../BaseAppDrawer";
import { FileListNew } from "components/lists/FileList/FileListNew";
import { CategoriesListNew } from "components/lists/CategoriesList/CategoriesListNew";
import { ClassifierListNew } from "components/lists/ClassifierList/ClassifierListNew";
import { SegmenterListNew } from "components/lists/SegmenterList/SegmenterListNew";

export const ProjectDrawerNew = () => {
  return (
    <BaseAppDrawer>
      <AppBarOffset />

      <FileListNew />

      <Divider />
      <CustomTabSwitcher
        childClassName="drawer-tab"
        label1="Classifier"
        label2="Segmenter"
      >
        <ClassifierListNew />

        <SegmenterListNew />
      </CustomTabSwitcher>

      <DividerHeader sx={{ my: 1 }} textAlign="left" typographyVariant="body2">
        Categories
      </DividerHeader>
      <CategoriesListNew />
    </BaseAppDrawer>
  );
};
