import React from "react";
import { Image } from "../../../types/Image";
import { CssBaseline } from "@material-ui/core";
import { useStyles } from "./ImageViewer.css";
import { SettingsDrawer } from "../SettingsDrawer";
import { ImageViewerAppBar } from "../ImageViewerAppBar/ImageViewerAppBar";
import { ImageViewerContent } from "../ImageViewerContent";

type ImageViewerProps = {
  data: Image;
};

export const ImageViewer = ({ data }: ImageViewerProps) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CssBaseline />

      <ImageViewerAppBar data={data} />

      <ImageViewerContent data={data} />

      <SettingsDrawer data={data} />
    </div>
  );
};
