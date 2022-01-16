import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Button } from "@mui/material";

type SegmenterSettingsDialogAppBarProps = {
  onClose: () => void;
};

export const SegmenterSettingsDialogAppBar = ({
  onClose,
}: SegmenterSettingsDialogAppBarProps) => {
  const onClick = async () => {
    // const history = await train_mnist();
    // console.info(history);
    // debugger;
  };

  return (
    <AppBar
      sx={{ borderBottom: "1px solid rgba(0, 0, 0, 0.12)", boxShadow: "none" }}
    >
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
