import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { Point } from "utils/types";

export const zoomAndOffset = (
  stage: Konva.Stage,
  newScale: number,
  center: Point,
  maxScrollRight?: number,
  maxScrollLeft?: number,
) => {
  if (!center || !stage) return;

  const stageX = stage.x();
  const stageY = stage.y();
  const stageScale = stage.scaleX();
  const stageWidth = stage.width();

  const mousePointTo = {
    x: (center.x - stageX!) / stageScale,
    y: (center.y - stageY!) / stageScale,
  };

  const newPos = {
    x: center.x - mousePointTo.x * newScale,
    y: center.y - mousePointTo.y * newScale,
  };

  if (maxScrollRight && newPos.x > maxScrollRight) {
    newPos.x = maxScrollRight;
  }

  if (maxScrollLeft) {
    // Recalculate maxScrollLeft for the new scale
    // Original formula: -(totalContentWidth * scale - stageWidth + spacing)
    // We need to scale the content width from old scale to new scale
    const contentWidthAtUnitScale =
      (-1 * maxScrollLeft + stageWidth - 20) / stageScale;
    const newMaxScrollLeft = -(
      contentWidthAtUnitScale * newScale -
      stageWidth +
      20
    );

    if (newPos.x < newMaxScrollLeft) {
      newPos.x = newMaxScrollLeft;
    }
  }

  stage.position(newPos);
  stage.scale({ x: newScale, y: newScale });
};

export const handlePinchZoom = (
  event: KonvaEventObject<WheelEvent>,
  maxScrollRight?: number,
  maxScrollLeft?: number,
) => {
  const stage = event.target.getStage()!;
  const stageWidth = stage.width();
  const contentWidthAtUnitScale = maxScrollLeft! * -1 + stageWidth - 20;

  const { deltaY, ctrlKey } = event.evt;

  const oldScale = stage.scaleX();
  const direction = deltaY > 0 ? -1 : 1;

  // Use different scaling factors for different input types
  let scaleBy = 1.1; // Default for mouse wheel

  // Trackpad gestures often have smaller deltaY values and ctrlKey
  if (ctrlKey || Math.abs(deltaY) < 10) {
    scaleBy = 1.05; // More sensitive for trackpad
  }

  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  // if the total content width is less than the width of the stage, dont zoom out further
  if (contentWidthAtUnitScale < stageWidth && newScale < oldScale) {
    console.log("min list width reached");
    return;
  }
  const center = {
    x: stage.getPointerPosition()!.x,
    y: (stage.height() / 2) * stage.scaleX() + stage.y(),
  };

  zoomAndOffset(stage, newScale, center, maxScrollRight, maxScrollLeft);
};

export const getNewWheelPos = (
  event: KonvaEventObject<WheelEvent>,
  maxScrollRight?: number,
  maxScrollLeft?: number,
) => {
  event.evt.preventDefault();
  const stage = event.target.getStage()!;
  const { deltaX, deltaY, ctrlKey, metaKey } = event.evt;
  // Gesture detection
  const isZoomGesture = ctrlKey || metaKey;

  const isHorizontalPan =
    Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 0;
  const isVerticalPan =
    Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 0;
  const isBothAxisPan =
    Math.abs(deltaX) > 0 && Math.abs(deltaY) > 0 && !isZoomGesture;

  if (isZoomGesture) {
    // Zoom logic (same as above)
    handlePinchZoom(event, maxScrollRight, maxScrollLeft);
  } else if (isHorizontalPan || isVerticalPan || isBothAxisPan) {
    // Pan logic
    const currentPos = { x: stage.x(), y: stage.y() };

    // Adjust sensitivity based on zoom level
    const panSensitivity = 1 / stage.scaleX();

    const newX = currentPos.x - deltaX * panSensitivity;

    // Prevents panning past content limits
    if (maxScrollRight && newX > maxScrollRight) return;
    if (maxScrollLeft && newX < maxScrollLeft) return;

    const newPos = {
      x: currentPos.x - deltaX * panSensitivity,
      y: currentPos.y,
    };

    return newPos;
  }
};
