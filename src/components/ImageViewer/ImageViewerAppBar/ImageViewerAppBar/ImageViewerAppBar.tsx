import React from "react";
import { Image } from "../../../../types/Image";
import { AppBar, Toolbar } from "@material-ui/core";
import { useStyles } from "./ImageViewerAppBar.css";
import { LassoButtonGroup } from "../LassoButtonGroup";
import { MarqueeButtonGroup } from "../MarqueeButtonGroup";

type ImageViewerAppBarProps = {
  data: Image;
};

export const ImageViewerAppBar = ({ data }: ImageViewerAppBarProps) => {
  const classes = useStyles();

  return (
    <AppBar className={classes.appBar} color="inherit" position="fixed">
      <Toolbar>
        <MarqueeButtonGroup data={data} />
        <span>&nbsp;&nbsp;</span>
        <LassoButtonGroup data={data} />
      </Toolbar>
    </AppBar>
  );
};
