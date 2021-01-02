import React from "react";
import { Image } from "../../../types/Image";
import { Drawer } from "@material-ui/core";
import { useStyles } from "./SettingsDrawer.css";

type OptionsDrawerProps = {
  data: Image;
};

export const SettingsDrawer = ({ data }: OptionsDrawerProps) => {
  const classes = useStyles();

  return (
    <Drawer
      anchor="right"
      className={classes.drawer}
      classes={{ paper: classes.drawerPaper }}
      variant="permanent"
    >
      <div />
    </Drawer>
  );
};
