import IconButton from "@material-ui/core/IconButton";
import React from "react";
import { useStyles } from "./ImageDialogAppBar.css";
import { AppBar, Button, Slide, Toolbar } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import Typography from "@material-ui/core/Typography";
import BrushIcon from "@material-ui/icons/Brush";
import Crop32Icon from "@material-ui/icons/Crop32";
import PanToolIcon from "@material-ui/icons/PanTool";

type ImageDialogAppBarProps = {
  onClose: () => void;
};

export const ImageDialogAppBar = ({ onClose }: ImageDialogAppBarProps) => {
  const classes = useStyles();

  return (
    <AppBar color="inherit" position="fixed">
      <Toolbar>
        <IconButton
          className={classes.closeButton}
          edge="start"
          color="inherit"
          onClick={onClose}
        >
          <ClearIcon />
        </IconButton>

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
  );
};
