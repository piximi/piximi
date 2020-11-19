import { AppBar, Button, Toolbar } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import BrushIcon from "@material-ui/icons/Brush";
import Crop32Icon from "@material-ui/icons/Crop32";
import React from "react";
import { useStyles } from "./ImageDialogToolboxBar.css";
import IconButton from "@material-ui/core/IconButton";
import PanToolIcon from "@material-ui/icons/PanTool";

export const ImageDialogToolboxBar = () => {
  const classes = useStyles();

  return (
    <div className={classes.imageDialogToolboxBar}>
      <AppBar position="sticky" color="inherit">
        <Toolbar>
          <Typography color="inherit" style={{ paddingRight: 20 }} />
          <IconButton color="inherit" onClick={() => {}}>
            <BrushIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => {}}>
            <Crop32Icon />
          </IconButton>
          <div className={classes.grow} />
          <IconButton color="inherit" onClick={() => {}}>
            <PanToolIcon />
          </IconButton>
          <Button />
        </Toolbar>
      </AppBar>
    </div>
  );
};
