import { FileList } from "../FileList";
import { CategoriesList } from "../CategoriesList";
import { ClassifierList } from "../ClassifierList";
import { SegmenterList } from "../SegmenterList";
import { ApplicationList } from "../ApplicationList";
import React from "react";
import { useStyles } from "./ApplicationDrawer.css";
import { Divider, Drawer } from "@mui/material";

export const ApplicationDrawer = () => {
  const classes = useStyles();

  return (
    <Drawer
      anchor="left"
      className={classes.drawer}
      classes={{ paper: classes.drawerPaper }}
      open
      variant="persistent"
    >
      <div className={classes.drawerHeader} />

      <FileList />

      <Divider />

      <CategoriesList />

      <Divider />

      <ClassifierList />
      <SegmenterList />

      <Divider />

      <ApplicationList />
    </Drawer>
  );
};
