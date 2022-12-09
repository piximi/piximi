import { useDispatch, useSelector } from "react-redux";
import { KonvaEventObject } from "konva/lib/Node";

import {
  stageScaleSelector,
  toolTypeSelector,
  zoomSelectionSelector,
  scaledImageWidthSelector,
  setZoomSelection,
  scaledImageHeightSelector,
  setStageScale,
  setStagePosition,
  stageWidthSelector,
  stageHeightSelector,
  stagePositionSelector,
} from "store/annotator";
import { zoomToolOptionsSelector } from "store/tool-options";

import { Point, ToolType, ZoomModeType } from "types";
import React, { useEffect, useState } from "react";
import { Stage } from "konva/lib/Stage";

export const useZoom = () => {
  const delta = 10;
  const scaleBy = 1.1;

  const dispatch = useDispatch();
  const stageScale = useSelector(stageScaleSelector);
  const stageWidth = useSelector(stageWidthSelector);
  const stageHeight = useSelector(stageHeightSelector);
  const stagePosition = useSelector(stagePositionSelector);
  const toolType = useSelector(toolTypeSelector);
  const { automaticCentering, mode } = useSelector(zoomToolOptionsSelector);
  const zoomSelection = useSelector(zoomSelectionSelector);
  const imageHeight = useSelector(scaledImageHeightSelector);
  const imageWidth = useSelector(scaledImageWidthSelector);

  const zoomAndOffset = (newScale: number, center: Point) => {
    if (!center) return;
    dispatch(setStageScale({ stageScale: newScale }));
    const mousePointTo = {
      x: (center.x - stagePosition.x) / stageScale,
      y: (center.y - stagePosition.y) / stageScale,
    };

    var newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    dispatch(setStagePosition({ stagePosition: newPos }));
  };

  const artifactCorrection = () => {};

  const deselect = () => {
    dispatch(
      setZoomSelection({
        zoomSelection: {
          maximum: undefined,
          minimum: undefined,
          selecting: false,
          dragging: false,
          centerPoint: undefined,
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
    if (
      mode === ZoomModeType.Out ||
      !zoomSelection.selecting ||
      !position ||
      !zoomSelection.minimum
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
    if (!imageWidth || !zoomSelection.selecting) return;
    if (zoomSelection.dragging) {
      if (!position) return;

      dispatch(
        setZoomSelection({
          zoomSelection: { ...zoomSelection, maximum: position },
        })
      );

      if (!zoomSelection.minimum) return;

      const selectedWidth = position.x - zoomSelection.minimum.x;

      zoomAndOffset(stageWidth / selectedWidth, {
        x: zoomSelection.minimum.x + selectedWidth / 2,
        y: zoomSelection.minimum.y + selectedWidth / 2,
      });
    }

    dispatch(
      setZoomSelection({
        zoomSelection: { ...zoomSelection, dragging: false, selecting: false },
      })
    );
  };

  const onWheel = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    if (!imageWidth) return;
    const stage = event.target.getStage()!;
    const scaleBy = 1.02;

    const oldScale = stage.scaleX();

    const newScale =
      event.evt.deltaY > 0
        ? Math.min(5, oldScale * scaleBy)
        : Math.max(0.25, oldScale / scaleBy);

    let center;

    if (automaticCentering) {
      center = zoomSelection.centerPoint;
    } else {
      center = stage.getPointerPosition() as Point;
    }
    if (!center) return;
    zoomAndOffset(newScale, center);

    const labelGroup = stage.find(`#label-group`)[0];
    if (!labelGroup) return;
    const labelPosition = labelGroup.position();
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

  const handleDblClick = (event: KonvaEventObject<MouseEvent>) => {
    event.evt.preventDefault();
    if (!imageWidth) return;
    const stage = event.target.getStage()!;
    const scaleBy = 1.2;

    const oldScale = stage.scaleX();

    const newScale =
      mode === ZoomModeType.In
        ? Math.min(5, oldScale * scaleBy)
        : Math.max(0.25, oldScale / scaleBy);

    let center = stage.getPointerPosition() as Point;

    if (!center) return;
    zoomAndOffset(newScale, center);

    const labelGroup = stage.find(`#label-group`)[0];
    if (!labelGroup) return;
    const labelPosition = labelGroup.position();
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
    zoomAndOffset,
    handleDblClick,
  };
};
