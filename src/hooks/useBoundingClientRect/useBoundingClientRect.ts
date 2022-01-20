import useResizeObserver from "@react-hook/resize-observer";
import React, { useEffect, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  boundingClientRectSelector,
  imageSelector,
  stageHeightSelector,
  stageWidthSelector,
} from "../../store/selectors";
import {
  setBoundingClientRect,
  setStageScale,
  setStageWidth,
} from "../../store/slices";

export const useBoundingClientRect = (target: React.RefObject<HTMLElement>) => {
  const dispatch = useDispatch();

  const boundingClientRect = useSelector(boundingClientRectSelector);
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
  });

  useEffect(() => {
    dispatch(setStageWidth({ stageWidth: boundingClientRect.width }));
  }, [boundingClientRect.width, dispatch]);

  useEffect(() => {
    if (!image || !image.shape) return;

    console.log(image);

    //FIXME #136 it seems like we are not currently getting the current stageHeight. It currently stays fixes to the initial state in the redux store.
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
  }, [image?.shape, stageWidth, stageHeight, dispatch]);
};
