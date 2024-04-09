import React, { useLayoutEffect, useState } from "react";

import { Box } from "@mui/material";
import { useDndFileDrop } from "hooks";
import { StageNew } from "../Stage";
import { dimensions } from "utils/common/constants";

type StageWrapperProps = {
  onDrop: (files: FileList) => void;
  setOptionsVisibility: React.Dispatch<React.SetStateAction<boolean>>;
  persistOptions: boolean;
};

export const StageWrapperNew = ({
  onDrop,
  setOptionsVisibility,
  persistOptions,
}: StageWrapperProps) => {
  const [width, setWidth] = useState<number>(
    window.innerWidth - dimensions.leftDrawerWidth - dimensions.toolDrawerWidth
  );
  const [height, setHeight] = useState<number>(
    window.innerHeight - dimensions.stageInfoHeight
  );

  const [{ isOver }, dropTarget] = useDndFileDrop(onDrop);

  //useDefaultImage(DispatchLocation.ImageViewer);
  useLayoutEffect(() => {
    const resizeHandler = () => {
      setWidth(
        window.innerWidth -
          dimensions.leftDrawerWidth -
          dimensions.toolDrawerWidth
      );
      setHeight(window.innerHeight - dimensions.stageInfoHeight);
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  });

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
        !persistOptions && setOptionsVisibility(false);
      }}
    >
      <div ref={dropTarget}>
        <StageNew stageWidth={width - 48} stageHeight={height - 24} />
      </div>
    </Box>
  );
};
