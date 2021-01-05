import React from "react";
import { Image } from "../../../../../types/Image";
import Toolbar from "@material-ui/core/Toolbar";

type ImageViewerAppBarProps = {
  data: Image;
};

export const AppBarToolbar = ({ data }: ImageViewerAppBarProps) => {
  return <Toolbar />;
};
