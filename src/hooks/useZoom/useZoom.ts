import { useState } from "react";
import Konva from "konva";
import { useDispatch, useSelector } from "react-redux";
import { KonvaEventObject } from "konva/lib/Node";

import { imageViewerSlice } from "store/imageViewer";

import { selectToolType } from "store/annotator/selectors";

import { useDebounce } from "hooks/useDebounce";
import { Point } from "utils/annotator/types";
import { ToolType, ZoomMode } from "utils/annotator/enums";
import {
  selectActiveImageId,
  selectStageWidth,
  selectZoomSelection,
  selectZoomToolOptions,
} from "store/imageViewer/selectors";
import { getDistance } from "utils/annotator";
const delta = 10;
export const useZoom = (stage?: Konva.Stage | null) => {
  const [selectStart, setSelectStart] = useState<{ x: number; y: number }>();
  const [oldDist, setOldDist] = useState<number>();

  const dispatch = useDispatch();
  const stageWidth = useSelector(selectStageWidth);
  const toolType = useSelector(selectToolType);
  const { automaticCentering, mode } = useSelector(selectZoomToolOptions);
  const zoomSelection = useSelector(selectZoomSelection);
  const activeImageId = useSelector(selectActiveImageId);
  const updateZoomScale = useDebounce((scale: number) => {
    dispatch(
      imageViewerSlice.actions.setZoomToolOptions({ options: { scale } })
    );
  }, 300);

  const zoomAndOffset = (newScale: number, center: Point) => {
    if (!center || !stage) return;

    const stageX = stage.x();
    const stageY = stage.y();
    const stageScale = stage.scaleX();

    const mousePointTo = {
      x: (center.x - stageX!) / stageScale,
      y: (center.y - stageY!) / stageScale,
    };

    var newPos = {
      x: center.x - mousePointTo.x * newScale,
      y: center.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    stage.scale({ x: newScale, y: newScale });
  };

  const resetZoomSelection = () => {
    dispatch(
      imageViewerSlice.actions.setZoomSelection({
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

  const handleZoomMouseDown = (
    position: { x: number; y: number },
    event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
  ) => {
    if (toolType !== ToolType.Zoom) return;
    const stage = event.target.getStage()!;
    setSelectStart(stage.getPointerPosition()!);
    dispatch(
      imageViewerSlice.actions.setZoomSelection({
        zoomSelection: {
          ...zoomSelection,
          dragging: false,
          minimum: position,
          selecting: true,
        },
      })
    );
  };

  const handleZoomMouseMove = (
    position: { x: number; y: number },
    event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
  ) => {
    const stage = event.target.getStage()!;
    const _position = stage.getPointerPosition()!;
    if (
      mode === ZoomMode.Out ||
      !zoomSelection.selecting ||
      !position ||
      !zoomSelection.minimum ||
      !selectStart
    )
      return;

    dispatch(
      imageViewerSlice.actions.setZoomSelection({
        zoomSelection: {
          ...zoomSelection,
          dragging: Math.abs(_position.x - selectStart.x) >= delta,
          maximum: position,
        },
      })
    );
  };

  const handleZoomMouseUp = (
    position: { x: number; y: number },
    event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
  ) => {
    if (!activeImageId || !zoomSelection.selecting || !stage) return;
    if (zoomSelection.dragging) {
      const stage = event.target.getStage()!;
      const _position = stage.getPointerPosition()!;
      if (!_position || !position || !selectStart) return;

      dispatch(
        imageViewerSlice.actions.setZoomSelection({
          zoomSelection: { ...zoomSelection, maximum: position },
        })
      );

      if (!zoomSelection.minimum) return;

      const selectedWidth = Math.abs(_position.x - selectStart.x);
      const newScale = Math.max(
        Math.min(stageWidth / selectedWidth, 5),
        stage.scaleX()
      );
      let topLeft;
      if (selectStart.x < _position.x) {
        if (selectStart.y < _position.y) {
          topLeft = selectStart;
        } else {
          topLeft = { x: selectStart.x, y: _position.y };
        }
      } else {
        if (selectStart.y < _position.y) {
          topLeft = { x: _position.x, y: selectStart.y };
        } else {
          topLeft = _position;
        }
      }
      zoomAndOffset(newScale, {
        x: topLeft.x + selectedWidth / 2,
        y: topLeft.y + selectedWidth / 2,
      });
    }

    dispatch(
      imageViewerSlice.actions.setZoomSelection({
        zoomSelection: { ...zoomSelection, dragging: false, selecting: false },
      })
    );
  };

  const handleZoomScroll = (event: KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    if (!activeImageId) return;
    const stage = event.target.getStage()!;
    const scaleBy = 1.035;

    const oldScale = stage.scaleX();

    const newScale =
      event.evt.deltaY < 0
        ? Math.min(5, oldScale * scaleBy)
        : Math.max(0.25, oldScale / scaleBy);

    let center;

    if (automaticCentering) {
      center = {
        x: (stage.width() / 2) * stage.scaleX() + stage.x(),
        y: (stage.height() / 2) * stage.scaleX() + stage.y(),
      };
    } else {
      center = stage.getPointerPosition() as Point;
    }

    if (!center) return;
    zoomAndOffset(newScale, center);

    updateZoomScale(newScale);

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

  const handlePinchZoom = (event: KonvaEventObject<TouchEvent>) => {
    event.evt.preventDefault();
    if (!activeImageId) return;
    const stage = event.target.getStage()!;

    const oldScale = stage.scaleX();
    const touches = stage.getPointersPositions();
    if (touches.length < 2) {
      return;
    }
    const p1 = touches[0];
    const p2 = touches[1];
    const dist = getDistance(p1, p2);

    if (!oldDist) {
      setOldDist(dist);
      return;
    }
    const scaleBy = dist / oldDist;

    const newScale = oldScale * scaleBy;
    setOldDist(dist);

    let center;
    if (automaticCentering) {
      center = {
        x: (stage.width() / 2) * stage.scaleX() + stage.x(),
        y: (stage.height() / 2) * stage.scaleX() + stage.y(),
      };
    } else {
      center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 } as Point;
    }

    if (!center) return;
    zoomAndOffset(newScale, center);

    updateZoomScale(newScale);

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

  const handleZoomDblClick = (
    event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
  ) => {
    event.evt.preventDefault();
    if (!activeImageId) return;
    const stage = event.target.getStage()!;
    const scaleBy = 1.2;

    const oldScale = stage.scaleX();

    const newScale =
      mode === ZoomMode.In
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

  return {
    resetZoomSelection,
    handleZoomMouseDown,
    handleZoomMouseMove,
    handleZoomMouseUp,
    handleZoomScroll,
    zoomAndOffset,
    handleZoomDblClick,
    handlePinchZoom,
    setOldDist,
  };
};
