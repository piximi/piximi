import React, { useEffect, useRef, useState } from "react";

import { Box } from "@mui/material";
import { useBoundingClientRect, useDndFileDrop } from "hooks";
import { DispatchLocation, useDefaultImage } from "hooks/useDefaultImage";
import { Stage } from "../Stage";
import { dimensions } from "utils/common";

type StageWrapperProps = {
  onDrop: (files: FileList) => void;
  optionsVisibility: boolean;
};

export const StageWrapper = ({
  onDrop,
  optionsVisibility,
}: StageWrapperProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useBoundingClientRect(ref);
  const width =
    window.innerWidth -
    dimensions.annotatorDrawerWidth -
    dimensions.annotatorToolDrawerWidth;

  const [{ isOver }, dropTarget] = useDndFileDrop(onDrop);

  useDefaultImage(DispatchLocation.ImageViewer);

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default,
        width: width,
        height: window.innerHeight,
        border: isOver ? "5px solid blue" : "",
        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
      })}
      ref={ref}
    >
      <div ref={dropTarget}>
        <Stage />
      </div>
    </Box>
  );
};
