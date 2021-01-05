import React from "react";
import { Image } from "../../../../../types/Image";
import Toolbar from "@material-ui/core/Toolbar";
import { ToolbarButtonGroup } from "../ToolbarButtonGroup";

type ImageViewerAppBarProps = {
  data: Image;
};

export const AppBarToolbar = ({ data }: ImageViewerAppBarProps) => {
  return (
    <Toolbar>
      <ToolbarButtonGroup data={data} />
    </Toolbar>
  );
};
