import useResizeObserver from "@react-hook/resize-observer";
import React, { useEffect, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { imageSelector } from "store/common";
import {
  stageWidthSelector,
  stageHeightSelector,
  setStageScale,
  setBoundingClientRect,
  setStageWidth,
} from "store/annotator";

export const useBoundingClientRect = (target: React.RefObject<HTMLElement>) => {
  const dispatch = useDispatch();

  const stageWidth = useSelector(stageWidthSelector);
  const stageHeight = useSelector(stageHeightSelector);
  const image = useSelector(imageSelector);

  useLayoutEffect(() => {
    if (!target || !target.current) return;

    dispatch(
      setBoundingClientRect({
        boundingClientRect: target.current.getBoundingClientRect(),
      })
    );
  }, [dispatch, target]);

  useResizeObserver(target, (entry: ResizeObserverEntry) => {
    dispatch(
      setBoundingClientRect({
        boundingClientRect: entry.contentRect as DOMRect,
      })
    );

    dispatch(setStageWidth({ stageWidth: entry.contentRect.width }));
  });

  useEffect(() => {
    if (!image?.shape) return;

    if (image.shape.height / stageHeight > image.shape.width / stageWidth) {
      dispatch(
        setStageScale({
          stageScale: (0.95 * stageHeight) / image.shape.height,
        })
      );
    } else {
      dispatch(
        setStageScale({
          stageScale: (0.95 * stageWidth) / image.shape.width,
        })
      );
    }
  }, [dispatch, image?.shape, stageHeight, stageWidth]);
};
