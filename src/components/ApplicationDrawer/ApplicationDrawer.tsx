import { FileList } from "../FileList";
import { CategoriesList } from "../CategoriesList";
import { ClassifierList } from "../ClassifierList";
import { ApplicationList } from "../ApplicationList";
import React from "react";
import { Divider, Drawer } from "@mui/material";
import { AppBarOffset } from "components/styled/AppBarOffset";

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

      <CategoriesList />

      <Divider />

      <ClassifierList />
      {/*<SegmenterList />*/}

      <Divider />

      <ApplicationList />
    </Drawer>
  );
};
