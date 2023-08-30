import React from "react";

import { Divider, Drawer } from "@mui/material";

import {
  FileList,
  ClassifierList,
  SegmenterList,
  ApplicationOptionsList,
} from "components/lists";
import { AppBarOffset } from "components/styled-components";

export const ProjectDrawer = () => {
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
