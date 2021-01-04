import React from "react";
import { Image } from "../../../../../types/Image";
import { LassoButtonGroup } from "../LassoButtonGroup";
import { MarqueeButtonGroup } from "../MarqueeButtonGroup";
import { ProbabilisticButtonGroup } from "../ProbabilisticButtonGroup";
import Toolbar from "@material-ui/core/Toolbar";

type ImageViewerAppBarProps = {
  data: Image;
};

export const ToolbarButtonGroup = ({ data }: ImageViewerAppBarProps) => {
  return (
    <Toolbar>
      <MarqueeButtonGroup data={data} />
      <span>&nbsp;&nbsp;</span>
      <LassoButtonGroup data={data} />
      <span>&nbsp;&nbsp;</span>
      <ProbabilisticButtonGroup data={data} />
    </Toolbar>
  );
};
