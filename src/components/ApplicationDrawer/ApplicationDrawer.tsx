import { FileList } from "../FileList";
import { CategoriesList } from "../CategoriesList";
import { ApplicationList } from "../ApplicationList";
import React from "react";
import { useStyles } from "./ApplicationDrawer.css";
import { Divider, Drawer } from "@mui/material";
import { ClassifierListItem } from "../ClassifierListItem";
import { SegmenterListItem } from "../SegmenterListItem";
import { AnnotatorListItem } from "../AnnotatorListItem";

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

      {/*<ClassifierList />*/}
      <ClassifierListItem />

      <Divider />

      <SegmenterListItem />

      <Divider />

      <AnnotatorListItem />

      <Divider />

      <ApplicationList />
    </Drawer>
  );
};
