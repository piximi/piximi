import AppBar from "@material-ui/core/AppBar";
import clsx from "clsx";
import React from "react";
import { useStyles } from "./ApplicationAppBar.css";
import { ApplicationToolbar } from "../ApplicationToolbar";

type ApplicationAppBar = {
  open: boolean;
  toggle: () => void;
};

export const ApplicationAppBar = ({ open, toggle }: ApplicationAppBar) => {
  const classes = useStyles();

  return (
    <React.Fragment>
      <div className={classes.grow}>
        <AppBar
          className={clsx(classes.appBar, {
            [classes.appBarShift]: open,
          })}
          color="inherit"
          position="fixed"
        >
          <ApplicationToolbar toggle={toggle} open={open} />
        </AppBar>
      </div>
    </React.Fragment>
  );
};
