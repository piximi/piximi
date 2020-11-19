import IconButton from "@material-ui/core/IconButton";
import React from "react";
import { useStyles } from "./ImageDialogAppBar.css";
import { AppBar, Slide, Toolbar } from "@material-ui/core";
import ClearIcon from "@material-ui/icons/Clear";

type ImageDialogAppBarProps = {
  onClose: () => void;
};

export const ImageDialogAppBar = ({ onClose }: ImageDialogAppBarProps) => {
  const classes = useStyles();

  return (
    <React.Fragment>
      <Slide appear={false} direction="down">
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
          </Toolbar>
        </AppBar>
      </Slide>
    </React.Fragment>
  );
};
