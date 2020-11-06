import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import { useStyles } from "../../../../Application/Application.css";

type ClassifierSettingsDialogAppBarProps = {
  onClose: () => void;
};

export const ClassifierSettingsDialogAppBar = ({
  onClose,
}: ClassifierSettingsDialogAppBarProps) => {
  const classes = useStyles();

  return (
    <AppBar className={classes.settingsDialogAppBar}>
      <Toolbar>
        <IconButton edge="start" color="inherit" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};
