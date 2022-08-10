import React, { useRef } from "react";

import { Box } from "@mui/material";

import { Stage } from "../Stage";

import { useBoundingClientRect, useDndFileDrop } from "hooks";

type ContentProps = {
  onDrop: (files: FileList) => void;
};

export const Content = ({ onDrop }: ContentProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useBoundingClientRect(ref);

  const [{ isOver }, dropTarget] = useDndFileDrop(onDrop);

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
