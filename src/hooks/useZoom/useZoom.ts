import { useDispatch, useSelector } from "react-redux";
import { KonvaEventObject } from "konva/lib/Node";

import {
  stageScaleSelector,
  toolTypeSelector,
  zoomSelectionSelector,
  scaledImageWidthSelector,
  setOffset,
  setZoomSelection,
  scaledImageHeightSelector,
} from "store/annotator";
import { zoomToolOptionsSelector } from "store/tool-options";

import { ToolType, ZoomModeType } from "types";
import React, { useEffect, useState } from "react";
import { Stage } from "konva/lib/Stage";

export const useZoom = (stageRef: React.RefObject<Stage>) => {
  const delta = 10;
  const scaleBy = 1.1;

  const dispatch = useDispatch();
  const stageScale = useSelector(stageScaleSelector);
  const toolType = useSelector(toolTypeSelector);
  const { automaticCentering, mode } = useSelector(zoomToolOptionsSelector);
  const zoomSelection = useSelector(zoomSelectionSelector);
  const imageHeight = useSelector(scaledImageHeightSelector);
  const imageWidth = useSelector(scaledImageWidthSelector);
  const [draggable, setDraggable] = useState<boolean>(false);

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
      if (!position || !imageHeight || !imageWidth) return;

      const scaledWidth = zoomIn ? imageWidth * scaleBy : imageWidth / scaleBy;
      const scaledHeight = zoomIn
        ? imageHeight * scaleBy
        : imageHeight / scaleBy;
      const growX = (scaledWidth - imageWidth) / 2;
      const growY = (scaledHeight - imageHeight) / 2;
      const rateX = growX / (scaledWidth / 2);
      const rateY = growY / (scaledHeight / 2);
      dispatch(
        setOffset({
          offset: {
            x: rateX * position.x,
            y: rateY * position.y,
          },
        })
      );
    }
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
    if (toolType !== ToolType.Zoom || draggable) return;

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
      draggable
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
    if (!imageWidth || !zoomSelection.selecting || draggable) return;
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

  const onWheel = (
    event: KonvaEventObject<WheelEvent>,
    position?: { x: number; y: number }
  ) => {
    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "2" &&
      console.log(event);
    event.evt.preventDefault();
    if (!imageWidth || !position) return;
    const stage = event.target.getStage()!;

    const scaleBy = 1.02;

    const oldScale = stage.scaleX();

    const newScale =
      event.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    stage.scale({ x: newScale, y: newScale });
    let pointer;
    if (automaticCentering && toolType === ToolType.Zoom) {
      pointer = { x: stage.width() / 2, y: stage.height() / 2 };
    } else {
      pointer = stage.getPointerPosition();
    }
    if (!pointer) return;

    const mousePointTo = {
      x: pointer.x / oldScale - stage.x() / oldScale,
      y: pointer.y / oldScale - stage.y() / oldScale,
    };

    var newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);

    const labelGroup = stage.find(`#label-group`)[0];
    if (!labelGroup) return;
    const labelPosition = labelGroup.position();
    console.log(labelGroup);
    const labelPointTo = {
      x: labelPosition.x / oldScale - stage.x() / oldScale,
      y: labelPosition.y / oldScale - stage.y() / oldScale,
    };
    labelGroup.setAttrs({
      scaleX: 1 / stage.scaleX(),
      scaleY: 1 / stage.scaleY(),
    });

    var newLabelPos = {
      x: labelPosition.x - labelPointTo.x * newScale,
      y: labelPosition.y - labelPointTo.y * newScale,
    };

    labelGroup.setAttrs({
      position: newLabelPos,
    });
  };

  return {
    deselect,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
    draggable,
  };
};
