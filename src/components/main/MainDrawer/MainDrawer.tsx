import React from "react";

import { Divider, Drawer } from "@mui/material";

import { FileList } from "components/file-io/FileList";
import { ClassifierList } from "components/classifier/ClassifierList";
import {
  AppBarOffset,
  ApplicationOptionsList,
} from "components/common/styled-components";
import { SegmenterList } from "components/segmenter/SegmenterList/SegmenterList";

export const MainDrawer = () => {
  return (
    <Drawer
      anchor="left"
      sx={{
        flexShrink: 0,
        width: (theme) => theme.spacing(32),
        "& > 	.MuiDrawer-paper": {
          zIndex: 0,
          width: (theme) => theme.spacing(32),
        },
      }}
      open
      variant="persistent"
    >
      <AppBarOffset />

      <FileList />

      <Divider />

      <ClassifierList />

      <Divider />

      <SegmenterList />
      <Divider />

      <ApplicationOptionsList />
    </Drawer>
  );
};
