import { useCallback, useState } from "react";
import { KonvaEventObject } from "konva/lib/Node";

import { useThrottledCallback } from "hooks/useThrottledCallback";

import { Point } from "utils/types";
import { getNewWheelPos } from "../utils/stageUtils";

const IMAGE_SPACING = 20;

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
}

/**
 * Hook to manage stage interactions including wheel scrolling and mouse tooltips.
 * Handles throttled mouse movement for tooltips and wheel events for panning/zooming.
 *
 * @param activeMetadata - Active metadata (used for null check)
 * @param globalShape - Image dimensions for scroll calculations
 * @param htmlImages - Loaded images for calculating scroll bounds
 * @param stageWidth - Width of the stage viewport
 * @param setStagePosition - Function to update stage position state
 * @returns Object containing tooltip state, handlers, and setter
 */
export const useTrackStageInteractions = (
  activeMetadata: any,
  globalShape: { width: number; height: number },
  htmlImages: Record<string, { image: HTMLImageElement; pos: Point }>,
  stageWidth: number,
  setStagePosition: (pos: Point) => void,
  managementActive: boolean,
) => {
  const [tooltipProps, setTooltipProps] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });

  const throttledWheelLogic = useThrottledCallback(
    (event: KonvaEventObject<WheelEvent>) => {
      if (!activeMetadata) return;
      const stageScale = event.target.getStage()?.scaleX() ?? 1;

      const maxScrollRight = IMAGE_SPACING / 2;
      const maxScrollLeft =
        -1 *
        ((globalShape.width + IMAGE_SPACING) *
          Object.keys(htmlImages).length *
          stageScale -
          stageWidth +
          IMAGE_SPACING);
      const newPos = getNewWheelPos(event, maxScrollRight, maxScrollLeft);
      if (newPos) setStagePosition(newPos);
    },
    33, // ~30fps throttle
    [activeMetadata, globalShape, htmlImages, stageWidth],
  );

  const handleWheel = useCallback(
    (event: KonvaEventObject<WheelEvent>) => {
      event.evt.preventDefault();
      throttledWheelLogic(event);
    },
    [throttledWheelLogic],
  );

  const throttledMouseMove = useThrottledCallback(
    (evt: KonvaEventObject<MouseEvent>) => {
      const shape = evt.target;
      const stage = evt.target.getStage();
      if (!stage) return;

      if (shape && shape.name() === "annotation") {
        const mousePos = stage.getRelativePointerPosition();

        if (mousePos) {
          const id = shape.getAttr("id");
          setTooltipProps({
            visible: true,
            x: mousePos.x + 200,
            y: mousePos.y - 5,
            text: managementActive
              ? "Manage tracks from viewer below"
              : `${id.slice(0, 8)}`,
          });
        }
      }
    },
    16, // ~60fps throttle for smooth tooltip updates
    [],
  );

  const handleMouseOut = useCallback((evt: KonvaEventObject<MouseEvent>) => {
    const shape = evt.target;
    if (shape && shape.name() === "annotation") {
      setTooltipProps((prev) => ({ ...prev, visible: false }));
    }
  }, []);

  return {
    tooltipProps,
    setTooltipProps,
    handleWheel,
    throttledMouseMove,
    handleMouseOut,
  };
};
