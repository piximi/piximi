import { useDispatch, useSelector } from "react-redux";
import { KonvaEventObject } from "konva/lib/Node";

import {
  stageScaleSelector,
  toolTypeSelector,
  zoomSelectionSelector,
  scaledImageWidthSelector,
  setOffset,
  setStageScale,
  setZoomSelection,
  offsetSelector,
} from "store/annotator";
import { zoomToolOptionsSelector } from "store/tool-options";

import { HotkeyView, ToolType, ZoomModeType } from "types";
import { useHotkeys } from "hooks";
import { useState } from "react";

export const useZoom = () => {
  const delta = 10;
  const scaleBy = 1.1;

  const dispatch = useDispatch();

  const stageScale = useSelector(stageScaleSelector);
  const toolType = useSelector(toolTypeSelector);
  const { automaticCentering, mode } = useSelector(zoomToolOptionsSelector);
  const zoomSelection = useSelector(zoomSelectionSelector);

  const imageWidth = useSelector(scaledImageWidthSelector);
  const offset = useSelector(offsetSelector);
  const [cmd, setCmd] = useState<boolean>(false);

  useHotkeys(
    "command",
    () => {
      setCmd(true);
      console.log(cmd);
    },
    HotkeyView.Annotator,
    { keydown: true, keyup: false },
    [cmd]
  );
  useHotkeys(
    "command",
    () => {
      setCmd(false);
    },
    HotkeyView.Annotator,
    { keydown: false, keyup: true }
  );

  const zoomAndOffset = (
    position: { x: number; y: number } | undefined,
    scaleBy: number,
    zoomIn: boolean = true
  ) => {
    let newScale = zoomIn ? stageScale * scaleBy : stageScale / scaleBy;
    if (newScale < 0.25) {
      newScale = 0.25;
    } else if (newScale > 12.5) {
      newScale = 12.5;
    }
    if (!automaticCentering || zoomSelection.dragging) {
      if (!position) return;
      dispatch(
        setOffset({
          offset: {
            x: zoomIn ? position.x * scaleBy : position.x / scaleBy,
            y: zoomIn ? position.y * scaleBy : position.y / scaleBy,
          },
        })
      );
    }

    dispatch(
      setStageScale({
        stageScale: newScale,
      })
    );
  };

  const deselect = () => {
    dispatch(
      setZoomSelection({
        zoomSelection: {
          maximum: undefined,
          minimum: undefined,
          selecting: false,
          dragging: false,
        },
      })
    );
  };

  const onMouseDown = (position: { x: number; y: number }) => {
    if (toolType !== ToolType.Zoom) return;

    dispatch(
      setZoomSelection({
        zoomSelection: {
          ...zoomSelection,
          dragging: false,
          minimum: position,
          selecting: true,
        },
      })
    );
  };

  const onMouseMove = (position: { x: number; y: number }) => {
    if (mode === ZoomModeType.Out) return;

    if (!zoomSelection.selecting) return;

    if (!position || !zoomSelection.minimum) return;

    dispatch(
      setZoomSelection({
        zoomSelection: {
          ...zoomSelection,
          dragging: Math.abs(position.x - zoomSelection.minimum.x) >= delta,
          maximum: position,
        },
      })
    );
  };

  const onMouseUp = (position: { x: number; y: number }) => {
    if (!imageWidth) return;

    if (!zoomSelection.selecting) return;

    if (zoomSelection.dragging) {
      if (!position) return;

      dispatch(
        setZoomSelection({
          zoomSelection: { ...zoomSelection, maximum: position },
        })
      );

      if (!zoomSelection.minimum) return;

      const selectedWidth = position.x - zoomSelection.minimum.x;

      zoomAndOffset(
        {
          x: zoomSelection.minimum.x + selectedWidth / 2,
          y: zoomSelection.minimum.y + selectedWidth / 2,
        },
        imageWidth / selectedWidth / stageScale
      );
    } else {
      zoomAndOffset(position, scaleBy, mode === ZoomModeType.In);
    }

    dispatch(
      setZoomSelection({
        zoomSelection: { ...zoomSelection, dragging: false, selecting: false },
      })
    );
  };

  const onWheel = (event: KonvaEventObject<WheelEvent>) => {
    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "2" &&
      console.log(event);
    event.evt.preventDefault();
    if (toolType !== ToolType.Zoom) return;
    if (!imageWidth) return;
    const position = { x: imageWidth / 2, y: imageWidth / 2 };
    console.log(cmd);

    dispatch(
      setOffset({
        offset: {
          x: offset.x + event.evt.deltaX,
          y: offset.y + event.evt.deltaY,
        },
      })
    );

    // if (!imageWidth) return;
    // zoomAndOffset(
    //   { x: imageWidth / 2, y: imageWidth / 2 },
    //   1.01,
    //   event.evt.deltaY < 0
    // );
  };

  return {
    deselect,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
  };
};
