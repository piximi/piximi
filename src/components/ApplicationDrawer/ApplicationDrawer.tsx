import { FileList } from "../FileList";
import { ClassifierList } from "../ClassifierList";
import { ApplicationList } from "../ApplicationList";
import React from "react";
import { Divider, Drawer } from "@mui/material";
import { AppBarOffset } from "components/styled/AppBarOffset";
import { SegmenterList } from "components/segmenter/SegmenterList/SegmenterList";

export const ApplicationDrawer = () => {
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

      <ApplicationList />
    </Drawer>
  );
};
