import React from "react";
import { useStyles } from "./ModelDrawer.css";
import { Drawer } from "@mui/material";
import { taskSelector } from "../../store/selectors/taskSelector";
import { useSelector } from "react-redux";
import { ClassifierOptions } from "../ClassifierOptions/ClassifierOptions";

export const ModelDrawer = () => {
  const classes = useStyles();

  const task = useSelector(taskSelector);

  return (
    <Drawer
      anchor="right"
      className={classes.drawer}
      classes={{ paper: classes.drawerPaper }}
      open
      variant="persistent"
    >
      <ClassifierOptions />
    </Drawer>
  );
};
