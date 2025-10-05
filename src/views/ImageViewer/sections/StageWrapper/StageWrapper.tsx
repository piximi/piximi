import React, { useLayoutEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";

import { Stage } from "../Stage";

import { DIMENSIONS } from "utils/constants";
import { useMobileView } from "hooks";
import { useShouldShowTracklets } from "views/ImageViewer/state/TrackletContext";
import { TrackView } from "../track-viewer/TrackView";

export const StageWrapper = () => {
  const showTracklets = useShouldShowTracklets();
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
        overflow: "visible",
      })}
    >
      {showTracklets ? (
        <TrackView width={width} height={wrapperHeight} />
      ) : (
        <Stage stageWidth={width} stageHeight={stageHeight} />
      )}
    </Box>
  );
};
