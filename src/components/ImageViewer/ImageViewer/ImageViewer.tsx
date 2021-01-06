import React from "react";
import { Image } from "../../../types/Image";
import { CssBaseline } from "@material-ui/core";
import { useStyles } from "./ImageViewer.css";
import { MethodDrawer } from "../MethodDrawer";
import { ImageViewerAppBar } from "../ImageViewerAppBar";
import { ImageViewerContent } from "../ImageViewerContent/ImageViewerContent";
import { SettingsDrawer } from "../SettingsDrawer";

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

      <MethodDrawer data={data} />
    </div>
  );
};
