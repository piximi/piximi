import { AppBar, Button, Chip, Slide, Toolbar } from "@material-ui/core";
import clsx from "clsx";
import Typography from "@material-ui/core/Typography";
import LabelOutlinedIcon from "@material-ui/icons/LabelOutlined";
import GestureIcon from "@material-ui/icons/Gesture";
import IconButton from "@material-ui/core/IconButton";
import ViewComfyIcon from "@material-ui/icons/ViewComfy";
import ClearIcon from "@material-ui/icons/Clear";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import React from "react";
import { useStyles } from "../Application/Application.css";

export const ImageDialogToolboxBar = () => {
  const classes = useStyles();

  return (
    <div className={classes.imageDialogToolboxBar}>
      <AppBar position="sticky" color="inherit">
        <Toolbar>
          <Typography color="inherit" style={{ paddingRight: 20 }} />
          <Button />
        </Toolbar>
      </AppBar>
    </div>
  );
};
