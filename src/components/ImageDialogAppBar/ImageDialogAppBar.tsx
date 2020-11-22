import IconButton from "@material-ui/core/IconButton";
import React from "react";
import { useStyles } from "./ImageDialogAppBar.css";
import { AppBar, Button, Slide, Toolbar } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";
import Typography from "@material-ui/core/Typography";
import BrushIcon from "@material-ui/icons/Brush";
import Crop32Icon from "@material-ui/icons/Crop32";
import OpenWithIcon from "@material-ui/icons/OpenWith";

type ImageDialogAppBarProps = {
  onClose: () => void;
  onBoxClick: () => void;
  onBrushClick: () => void;
};

export const ImageDialogAppBar = ({
  onClose,
  onBoxClick,
  onBrushClick,
}: ImageDialogAppBarProps) => {
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

        <IconButton color="inherit" onClick={onBrushClick}>
          <BrushIcon />
        </IconButton>

        <IconButton color="inherit" onClick={onBoxClick}>
          <Crop32Icon />
        </IconButton>

        <div className={classes.grow} />

        <IconButton color="inherit" onClick={() => {}}>
          <OpenWithIcon />
        </IconButton>

        <Button />
      </Toolbar>
    </AppBar>
  );
};
