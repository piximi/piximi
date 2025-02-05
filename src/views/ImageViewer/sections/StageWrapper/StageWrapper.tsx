import React, { useLayoutEffect, useState } from "react";
import { Box } from "@mui/material";

import { Stage } from "../Stage";

import { dimensions } from "utils/common/constants";
import { useMobileView } from "hooks";
import { SideToolBar, TopToolBar } from "../tool-bars";

export const StageWrapper = () => {
  const [width, setWidth] = useState<number>(
    window.innerWidth - dimensions.leftDrawerWidth - dimensions.toolDrawerWidth,
  );
  const [height, setHeight] = useState<number>(
    window.innerHeight -
      dimensions.stageInfoHeight -
      dimensions.toolDrawerWidth,
  );

  const isMobile = useMobileView();

  //useDefaultImage(DispatchLocation.ImageViewer);
  useLayoutEffect(() => {
    const resizeHandler = () => {
      setWidth(
        window.innerWidth -
          dimensions.leftDrawerWidth -
          dimensions.toolDrawerWidth,
      );
      setHeight(
        window.innerHeight -
          dimensions.stageInfoHeight -
          dimensions.toolDrawerWidth,
      );
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  });

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default,
        width: width,
        height: height,
        display: "grid",
        gridTemplateColumns: `1fr ${dimensions.toolDrawerWidth}px`,
        gridTemplateRows: `${dimensions.toolDrawerWidth}px 1fr`,
        gridTemplateAreas: `"top-tools top-tools" "stage side-tools"`,
        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        overflow: "visible",
      })}
    >
      <TopToolBar />
      <Stage stageWidth={width} stageHeight={height} />
      {isMobile ? <></> : <SideToolBar />}
    </Box>
  );
};
