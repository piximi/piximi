import { FileList } from "../FileList";
import { CategoriesList } from "../CategoriesList";
import { ClassifierList } from "../ClassifierList";
import { SegmenterList } from "../SegmenterList";
import { ApplicationList } from "../ApplicationList";
import React from "react";
import { useStyles } from "./ModelIconsDrawer.css";
import { Divider, Drawer } from "@mui/material";
import { taskSelector } from "../../store/selectors/taskSelector";
import { useSelector } from "react-redux";
import { Task } from "../../types/Task";
import Box from "@mui/material/Box";

export const ModelIconsDrawer = () => {
  const classes = useStyles();

  const task = useSelector(taskSelector);

  return (
    <Drawer
      anchor="right"
      className={classes.drawer}
      classes={{ paper: classes.paper }}
      open
      variant="persistent"
    >
      {/*<div className={classes.drawerHeader} />*/}
    </Drawer>
  );
};
