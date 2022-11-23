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
  stagePositionSelector,
  setStagePosition,
} from "store/annotator";
import { zoomToolOptionsSelector } from "store/tool-options";

import { HotkeyView, ToolType, ZoomModeType } from "types";
import { useHotkeys } from "hooks";
import React, { useEffect, useState } from "react";
import { Stage } from "konva/lib/Stage";

export const useZoom = (stageRef: React.RefObject<Stage>) => {
  const delta = 10;
  const scaleBy = 1.1;

  const dispatch = useDispatch();
  const [draggable, setDraggable] = useState<boolean>(false);
  const stageScale = useSelector(stageScaleSelector);
  const toolType = useSelector(toolTypeSelector);
  const { automaticCentering, mode } = useSelector(zoomToolOptionsSelector);
  const zoomSelection = useSelector(zoomSelectionSelector);

  const imageWidth = useSelector(scaledImageWidthSelector);
  const offset = useSelector(offsetSelector);
  const [altControls, setAltControls] = useState<boolean>(false);
  const stagePosition = useSelector(stagePositionSelector);

  useHotkeys(
    "space",
    () => {
      setAltControls(true);
      console.log(altControls);
    },
    HotkeyView.Annotator,
    { keydown: true, keyup: false },
    [altControls]
  );
  useHotkeys(
    "space",
    () => {
      setAltControls(false);
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
    const abs = { x: position!.x / stageScale, y: position!.y / stageScale };
    const newPos = { x: abs.x * scaleBy, y: abs.y * scaleBy };
    console.log("newPos: ", newPos);
    if (!automaticCentering || zoomSelection.dragging) {
      if (!position) return;
      //console.log("abs: ", abs);
      //console.log("relative: ", position);

      //const diff = { x: abs.x - newPos.x, y: abs.y - newPos.y };

      //stageRef.current!.position(diff);
      // dispatch(
      //   setOffset({
      //     offset: {
      //       x: zoomIn ? position.x * scaleBy : position.x / scaleBy,
      //       y: zoomIn ? position.y * scaleBy : position.y / scaleBy,
      //     },
      //   })
      // );
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
    if (toolType !== ToolType.Zoom || altControls) return;

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
    if (
      mode === ZoomModeType.Out ||
      !zoomSelection.selecting ||
      !position ||
      !zoomSelection.minimum ||
      altControls
    )
      return;

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
    if (!imageWidth || !zoomSelection.selecting || altControls) return;
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
    if (toolType !== ToolType.Zoom || !imageWidth) return;
    if (!altControls) {
      dispatch(
        setStagePosition({
          stagePosition: {
            x: stagePosition.x - event.evt.deltaX,
            y: stagePosition.y - event.evt.deltaY,
          },
        })
      );
    } else {
      zoomAndOffset(
        { x: imageWidth / 2, y: imageWidth / 2 },
        1.01,
        event.evt.deltaY < 0
      );
    }
  };
  useEffect(() => {
    setDraggable(altControls);
  }, [altControls]);

  return {
    deselect,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
    draggable,
  };
};
