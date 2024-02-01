import React from "react";

import { Divider } from "@mui/material";

import { ClassifierList, SegmenterList } from "components/lists";
import { AppBarOffset, CustomTabSwitcher } from "components/styled-components";
import { BaseAppDrawer } from "../BaseAppDrawer";
import { FileListNew } from "components/lists/FileList/FileListNew";

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
        <ClassifierList />

        <SegmenterList />
      </CustomTabSwitcher>
    </BaseAppDrawer>
  );
};
