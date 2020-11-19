import AppBar from "@material-ui/core/AppBar";
import React from "react";
import { useStyles } from "./ApplicationAppBar.css";
import { ApplicationToolbar } from "../ApplicationToolbar";

export const ApplicationAppBar = () => {
  const classes = useStyles();

  return (
    <React.Fragment>
      <div className={classes.grow}>
        <AppBar className={classes.appBar} color="inherit" position="fixed">
          <ApplicationToolbar />
        </AppBar>
      </div>
    </React.Fragment>
  );
};
