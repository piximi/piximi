import React from "react";
import { Image } from "../../../types/Image";
import { Drawer } from "@material-ui/core";
import { useStyles } from "./SettingsDrawer.css";
import Divider from "@material-ui/core/Divider";

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
      <div className={classes.toolbar} />

      <Divider />
    </Drawer>
  );
};
