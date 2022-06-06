import React, { useRef } from "react";
import { Stage } from "../Stage";
import { useBoundingClientRect } from "../../../../hooks/useBoundingClientRect";
import { Box } from "@mui/material";
import { useDndFileDrop } from "hooks/useDndFileDrop/useDndFileDrop";

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
