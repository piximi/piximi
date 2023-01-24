import useResizeObserver from "@react-hook/resize-observer";
import React, { useLayoutEffect } from "react";
import { useDispatch } from "react-redux";

import {
  setBoundingClientRect,
  setStageWidth,
  setStageHeight,
} from "store/annotator";

export const useBoundingClientRect = (target: React.RefObject<HTMLElement>) => {
  const dispatch = useDispatch();

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
    dispatch(setStageHeight({ stageHeight: entry.contentRect.height }));
  });

  // useEffect(() => {
  //   if (!image?.shape) return;

  //   if (image.shape.height / stageHeight > image.shape.width / stageWidth) {
  //     dispatch(
  //       setStageScale({
  //         stageScale: (0.95 * stageHeight) / image.shape.height,
  //       })
  //     );
  //   } else {
  //     dispatch(
  //       setStageScale({
  //         stageScale: (0.95 * stageWidth) / image.shape.width,
  //       })
  //     );
  //   }
  // }, [dispatch, image?.shape, stageHeight, stageWidth]);
};
