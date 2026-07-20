import React, { useLayoutEffect, useMemo, useState } from "react";

import { Box } from "@mui/material";

import { useMobileView } from "hooks";

import { DIMENSIONS } from "utils/constants";

import { ThreeStage } from "../ThreeStage/ThreeStage";

export const StageWrapper = () => {
  const [width, setWidth] = useState<number>(
    window.innerWidth -
      DIMENSIONS.leftDrawerWidth -
      DIMENSIONS.toolDrawerWidth * 2,
  );
  const [wrapperHeight, setWrapperHeight] = useState<number>(
    window.innerHeight - DIMENSIONS.toolDrawerWidth,
  );

  const stageHeight = useMemo(
    () => wrapperHeight - DIMENSIONS.stageInfoHeight,
    [wrapperHeight],
  );

  const isMobile = useMobileView();

  useLayoutEffect(() => {
    const resizeHandler = () => {
      setWidth(
        window.innerWidth -
          (isMobile
            ? DIMENSIONS.toolDrawerWidth
            : DIMENSIONS.toolDrawerWidth + DIMENSIONS.leftDrawerWidth) -
          DIMENSIONS.toolDrawerWidth,
      );
      setWrapperHeight(window.innerHeight - DIMENSIONS.toolDrawerWidth);
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
        height: wrapperHeight,
        gridArea: "stage",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "4px 4px 0 0",
        overflow: "visible",
      })}
    >
      <ThreeStage stageWidth={width} stageHeight={stageHeight} />
    </Box>
  );
};
