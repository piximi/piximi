import React, { useRef } from "react";
import { Stage } from "../Stage";
import { NativeTypes } from "react-dnd-html5-backend";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { useBoundingClientRect } from "../../../../hooks/useBoundingClientRect";
import { Box } from "@mui/material";

type ContentProps = {
  onDrop: (item: { files: any[] }) => void;
};

export const Content = ({ onDrop }: ContentProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useBoundingClientRect(ref);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop(item: { files: any[] }) {
        if (onDrop) {
          onDrop(item);
        }
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    []
  );

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.palette.background.default,
        width: "100%",
        border: isOver ? "5px solid blue" : "",
      })}
      ref={ref}
    >
      <div ref={drop}>
        <Stage />
      </div>
    </Box>
  );
};
