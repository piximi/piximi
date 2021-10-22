import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useStyles } from "../Application/Application.css";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Button } from "@mui/material";

type SegmenterSettingsDialogAppBarProps = {
  onClose: () => void;
};

export const SegmenterSettingsDialogAppBar = ({
  onClose,
}: SegmenterSettingsDialogAppBarProps) => {
  const classes = useStyles();

  const onClick = async () => {
    // const history = await train_mnist();
    // console.info(history);
    // debugger;
  };

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
