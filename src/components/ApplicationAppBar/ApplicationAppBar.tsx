import React from "react";
import { ApplicationToolbar } from "../ApplicationToolbar";
import { useStyles } from "./ApplicationAppBar.css";
import { AppBar } from "@mui/material";

export const ApplicationAppBar = () => {
  const classes = useStyles();

  return (
    <div className={classes.grow}>
      <AppBar className={classes.appBar} color="inherit" position="fixed">
        <ApplicationToolbar />
      </AppBar>
    </div>
  );
};
