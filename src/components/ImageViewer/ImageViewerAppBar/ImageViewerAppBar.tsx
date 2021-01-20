import AppBar from "@material-ui/core/AppBar";
import React from "react";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { Chip } from "@material-ui/core";
import { useStyles } from "./ImageViewerAppBar.css";
import { OpenImageButton } from "../OpenImageButton";

export const ImageViewerAppBar = () => {
  const classes = useStyles();

  return (
    <AppBar className={classes.appBar} color="inherit" position="fixed">
      <Toolbar>
        <Typography className={classes.logo} variant="h6">
          <strong>Piximi</strong> Image viewer <Chip label="Early access" />
        </Typography>

        <div className={classes.grow} />

        <OpenImageButton />
      </Toolbar>
    </AppBar>
  );
};
