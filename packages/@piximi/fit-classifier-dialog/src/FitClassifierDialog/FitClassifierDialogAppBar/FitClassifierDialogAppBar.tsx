import AppBar from "@material-ui/core/AppBar/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Tooltip from "@material-ui/core/Tooltip";
import ArrowBack from "@material-ui/icons/ArrowBack";
import PlayCircleOutline from "@material-ui/icons/PlayCircleOutline";
import ReplayRounded from "@material-ui/icons/ReplayRounded";
import Stop from "@material-ui/icons/Stop";
import * as React from "react";
import {useStyles} from "./FitClassifierDialogAppBar.css";
import IconButton from "@material-ui/core/IconButton";

type FitClassifierDialogAppBar = {
  closeDialog: () => void;
};

const onStart = () => {};

const onStop = () => {};

const onRestart = () => {};

export const FitClassifierDialogAppBar = ({
  closeDialog
}: FitClassifierDialogAppBar) => {
  const classes = useStyles({});

  return (
    <AppBar className={classes.appBar}>
      <Toolbar>
        <Tooltip title={"Close"}>
          <IconButton aria-label={"close"} onClick={closeDialog}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
        <div className={classes.grow} />
        <Tooltip title={"Start"}>
          <IconButton aria-label={"start"} onClick={onStart}>
            <PlayCircleOutline />
          </IconButton>
        </Tooltip>
        <Tooltip title={"Stop"}>
          <IconButton aria-label={"stop"} onClick={onStop}>
            <Stop />
          </IconButton>
        </Tooltip>
        <Tooltip title={"Restart"}>
          <IconButton aria-label={"restart"} onClick={onRestart}>
            <ReplayRounded />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
