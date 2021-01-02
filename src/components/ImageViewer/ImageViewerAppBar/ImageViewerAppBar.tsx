import React from "react";
import { Image } from "../../../types/Image";
import { AppBar, Toolbar, Typography } from "@material-ui/core";
import { useStyles } from "./ImageViewerAppBar.css";

type ImageViewerAppBarProps = {
  data: Image;
};

export const ImageViewerAppBar = ({ data }: ImageViewerAppBarProps) => {
  const classes = useStyles();

  return (
    <AppBar className={classes.appBar} position="fixed">
      <Toolbar>
        <Typography noWrap variant="h6">
          Image viewer
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
