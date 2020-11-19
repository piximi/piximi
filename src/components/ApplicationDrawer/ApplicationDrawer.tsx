import Divider from "@material-ui/core/Divider";
import { FileList } from "../FileList";
import { CategoriesList } from "../CategoriesList";
import { ClassifierList } from "../ClassifierList";
import { ApplicationList } from "../ApplicationList";
import Drawer from "@material-ui/core/Drawer";
import React from "react";
import { useStyles } from "./ApplicationDrawer.css";

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

      <Divider />

      <ApplicationList />
    </Drawer>
  );
};
