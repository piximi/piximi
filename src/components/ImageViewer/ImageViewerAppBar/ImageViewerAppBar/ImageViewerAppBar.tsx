import React from "react";
import { Image } from "../../../../types/Image";
import { AppBar } from "@material-ui/core";
import { useStyles } from "./ImageViewerAppBar.css";
import { AppBarToolbar } from "../AppBarToolbar";

type ImageViewerAppBarProps = {
  data: Image;
};

export const ImageViewerAppBar = ({ data }: ImageViewerAppBarProps) => {
  const classes = useStyles();

  return (
    <AppBar className={classes.appBar} color="inherit" position="fixed">
      <AppBarToolbar data={data} />
    </AppBar>
  );
};
