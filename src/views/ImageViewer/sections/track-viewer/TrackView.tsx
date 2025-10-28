import { Box } from "@mui/material";
import React, { useLayoutEffect, useRef, useState } from "react";
import { TrackletContainer } from "./TrackletContainer";
import { TrackStage } from "./TrackStage";

export const TrackView = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => {
  const containerRef = useRef<HTMLDivElement>();
  const [stageWidth, setStageWidth] = useState(width - 16);
  const [stageHeight, setStageHeight] = useState((height - 48) / 2);
  useLayoutEffect(() => {
    if (containerRef.current) {
      const { width: containerWidth, height: containerHeight } =
        containerRef.current.getBoundingClientRect();
      const { paddingLeft, paddingRight, paddingTop, paddingBottom } =
        window.getComputedStyle(containerRef.current);
      const computedWidth =
        containerWidth - parseFloat(paddingLeft) - parseFloat(paddingRight);
      const computedHeight =
        containerHeight - parseFloat(paddingTop) - parseFloat(paddingBottom);

      setStageWidth(computedWidth);
      setStageHeight((computedHeight - 16) / 2);
    }
  }, [width, height]);

  return (
    <Box
      ref={containerRef}
      sx={(theme) => ({
        bgcolor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        p: 2,
        gap: 2,
      })}
    >
      <TrackStage stageHeight={stageHeight} stageWidth={stageWidth} />
      <TrackletContainer height={stageHeight} width={stageWidth} />
    </Box>
  );
};
