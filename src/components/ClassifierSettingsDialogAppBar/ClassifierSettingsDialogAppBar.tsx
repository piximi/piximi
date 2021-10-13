import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import { useStyles } from "../Application/Application.css";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { Box, Button } from "@material-ui/core";
import { train_mnist } from "../FitClassifierDialog/FitClassifierDialog/fit_mnist";

type ClassifierSettingsDialogAppBarProps = {
  onClose: () => void;
};

export const ClassifierSettingsDialogAppBar = ({
  onClose,
}: ClassifierSettingsDialogAppBarProps) => {
  const classes = useStyles();

  const onClick = async () => {
    // const history = await train_mnist();
    // console.info(history);
    // debugger;
  };

  //TODO I would like the play button to be on the right side of the toolbar
  return (
    <AppBar className={classes.settingsDialogAppBar}>
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose}>
          <CloseIcon />
        </IconButton>
        <Button color="inherit" onClick={onClick}>
          Run Classifier
          <IconButton color="inherit">
            <PlayArrowIcon />
          </IconButton>
        </Button>
      </Toolbar>
    </AppBar>
  );
};
