import React, { useLayoutEffect, useState } from "react";

import { Box } from "@mui/material";
import { useDndFileDrop } from "hooks";
import { DispatchLocation, useDefaultImage } from "hooks/useDefaultImage";
import { Stage } from "../Stage";
import { dimensions } from "utils/common";
import { useDispatch } from "react-redux";
import { setStageHeight, setStageWidth } from "store/annotator";

type StageWrapperProps = {
  onDrop: (files: FileList) => void;
};

export const StageWrapper = ({ onDrop }: StageWrapperProps) => {
  const dispatch = useDispatch();

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
      const w =
        window.innerWidth -
        dimensions.annotatorDrawerWidth -
        dimensions.annotatorToolDrawerWidth;
      const h = window.innerHeight - dimensions.stageInfoHeight;
      setWidth(w);
      setHeight(h);
      dispatch(setStageWidth({ stageWidth: w - 48 }));
      dispatch(setStageHeight({ stageHeight: h - 24 }));
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  });

  useLayoutEffect(() => {
    dispatch(
      setStageWidth({
        stageWidth:
          window.innerWidth -
          dimensions.annotatorDrawerWidth -
          dimensions.annotatorToolDrawerWidth -
          48,
      })
    );
    dispatch(
      setStageHeight({
        stageHeight: window.innerHeight - dimensions.stageInfoHeight - 24,
      })
    );
  }, [dispatch]);

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
    >
      <div ref={dropTarget}>
        <Stage />
      </div>
    </Box>
  );
};
