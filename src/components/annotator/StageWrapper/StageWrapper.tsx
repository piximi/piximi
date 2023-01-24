import React, { useRef } from "react";

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

  const [{ isOver }, dropTarget] = useDndFileDrop(onDrop);

  useDefaultImage(DispatchLocation.ImageViewer);

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default,
        width: "100%",
        border: isOver ? "5px solid blue" : "",
      })}
      ref={ref}
    >
      <div ref={dropTarget}>
        <Stage />
      </div>
    </Box>
  );
};
