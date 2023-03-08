import React, { useLayoutEffect, useState } from "react";

import { Box } from "@mui/material";
import { useDndFileDrop } from "hooks";
import { DispatchLocation, useDefaultImage } from "hooks/useDefaultImage";
import { Stage } from "../Stage";
import { dimensions } from "utils/common";

type StageWrapperProps = {
  onDrop: (files: FileList) => void;
  setOptionsVisibility: React.Dispatch<React.SetStateAction<boolean>>;
};

export const StageWrapper = ({
  onDrop,
  setOptionsVisibility,
}: StageWrapperProps) => {
  const [width, setWidth] = useState<number>(
    window.innerWidth -
      dimensions.annotatorDrawerWidth -
      dimensions.annotatorToolDrawerWidth
  );
  const [height, setHeight] = useState<number>(
    window.innerHeight - dimensions.stageInfoHeight
  );
  useLayoutEffect(() => {
    const resizeHandler = () => {
      setWidth(
        window.innerWidth -
          dimensions.annotatorDrawerWidth -
          dimensions.annotatorToolDrawerWidth
      );
      setHeight(window.innerHeight - dimensions.stageInfoHeight);
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  });

  const [{ isOver }, dropTarget] = useDndFileDrop(onDrop);

  useDefaultImage(DispatchLocation.ImageViewer);

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default,
        width: width,
        height: height,
        border: isOver ? "5px solid blue" : "",
        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
        p: "1.5rem 1.5rem 0 1.5rem",
      })}
      onMouseEnter={() => {
        setOptionsVisibility(false);
      }}
    >
      <div ref={dropTarget}>
        <Stage stageWidth={width - 48} stageHeight={height - 24} />
      </div>
    </Box>
  );
};
