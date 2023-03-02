import React from "react";

import { Divider, Drawer } from "@mui/material";

import { ApplicationOptionsList } from "../../common/ApplicationOptionsList";
import { FileList } from "components/file-io/FileList";
import { ClassifierList } from "components/classifier/ClassifierList";
import { AppBarOffset } from "components/styled/AppBarOffset";
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

      {process.env.NODE_ENV === "development" && <SegmenterList />}
      <Divider />

      <ApplicationOptionsList />
    </Drawer>
  );
};
