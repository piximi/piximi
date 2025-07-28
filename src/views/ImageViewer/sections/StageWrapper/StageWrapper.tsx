import React, { useLayoutEffect, useState } from "react";
import { Box } from "@mui/material";

import { Stage } from "../Stage";

import { DIMENSIONS } from "utils/constants";
import { useMobileView } from "hooks";

export const StageWrapper = () => {
  const [width, setWidth] = useState<number>(
    window.innerWidth -
      DIMENSIONS.leftDrawerWidth -
      DIMENSIONS.toolDrawerWidth * 2,
  );
  const [height, setHeight] = useState<number>(
    window.innerHeight - DIMENSIONS.toolDrawerWidth,
  );
  const isMobile = useMobileView();

  //useDefaultImage(DispatchLocation.ImageViewer);
  useLayoutEffect(() => {
    const resizeHandler = () => {
      setWidth(
        window.innerWidth -
          (isMobile
            ? DIMENSIONS.toolDrawerWidth
            : DIMENSIONS.toolDrawerWidth + DIMENSIONS.leftDrawerWidth) -
          DIMENSIONS.toolDrawerWidth,
      );
      setHeight(window.innerHeight - DIMENSIONS.toolDrawerWidth);
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isMobile]);

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default,
        width: width,
        height: height,
        gridArea: "stage",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "4px 4px 0 0",
        overflow: "visible",
      })}
    >
      <Stage stageWidth={width} stageHeight={height} />
    </Box>
  );
};
