import React from "react";

import { Divider } from "@mui/material";

import { FileList, ClassifierList, SegmenterList } from "components/lists";
import { AppBarOffset, CustomTabSwitcher } from "components/styled-components";
import { BaseAppDrawer } from "../BaseAppDrawer";

export const ProjectDrawer = () => {
  return (
    <BaseAppDrawer>
      <AppBarOffset />

      <FileList />

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
