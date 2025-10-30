import React, { useLayoutEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Box } from "@mui/material";

import { useMobileView } from "hooks";

import { DIMENSIONS } from "utils/constants";

import { Stage } from "../Stage";
import { selectShowTracklets } from "views/ImageViewer/state/image-viewer-data/selectors";
import { TrackViewContainer } from "features/annotation-tracking/TrackingViewContainer";

export const StageWrapper = () => {
  const showTracklets = useSelector(selectShowTracklets);
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
        <TrackViewContainer width={width} height={wrapperHeight} />
      ) : (
        <Stage stageWidth={width} stageHeight={stageHeight} />
      )}
    </Box>
  );
};
