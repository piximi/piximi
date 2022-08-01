import React from "react";

import { Divider, Drawer } from "@mui/material";

import { FileList } from "components/FileList";
import { CategoriesList } from "components/CategoriesList";
import { ClassifierList } from "components/ClassifierList";
import { ApplicationList } from "components/ApplicationList";
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

      <Divider />

      <ApplicationList />
    </Drawer>
  );
};
