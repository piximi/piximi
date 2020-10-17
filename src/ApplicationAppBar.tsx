import AppBar from "@material-ui/core/AppBar";
import clsx from "clsx";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { useStyles } from "./index.css";

type ApplicationAppBar = {
  onOpenDrawer: () => void;
  openDrawer: boolean;
};

export const ApplicationAppBar = ({
  onOpenDrawer,
  openDrawer,
}: ApplicationAppBar) => {
  const classes = useStyles();

  return (
    <AppBar
      className={clsx(classes.appBar, { [classes.appBarShift]: openDrawer })}
      position="fixed"
    >
      <Toolbar>
        <IconButton color="inherit" onClick={onOpenDrawer} edge="start">
          <MenuIcon />
        </IconButton>

        <Typography color="inherit" noWrap variant="h6">
          Piximi
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
