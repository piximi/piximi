import { useCallback, useEffect, useState } from "react";
import Konva from "konva";
import * as ImageJS from "image-js";
import { Point } from "utils/annotator/types";

export const usePointerLocation = (
  imageRef: React.MutableRefObject<Konva.Image | null>,
  stageRef: React.RefObject<Konva.Stage | null>,
  originalImage: ImageJS.Image
) => {
  const [absolutePosition, setAbsolutePosition] = useState<Point>();
  const [positionByStage, setPositionByStage] = useState<Point>();
  const [outOfBounds, setOutOfBounds] = useState<boolean>(false);
  const [pixelColor, setPixelColor] = useState<string>();

  const getPositionFromImage = useCallback(
    (position: Point): Point | undefined => {
      if (!imageRef || !imageRef.current) return;

      const transform = imageRef.current.getAbsoluteTransform().copy();

      transform.invert();

      const imageOffset = transform.point(position);

      return {
        x: (imageOffset.x / imageRef.current.width()) * originalImage.width,
        y: (imageOffset.y / imageRef.current.height()) * originalImage.height,
      };
    },
    [imageRef, originalImage]
  );
  const getRelativePosition = useCallback(
    (position: Point, ref: Konva.Node | null): Point | undefined => {
      if (!ref) return;

      const transform = ref.getAbsoluteTransform().copy();

      transform.invert();
      return transform.point(position);
    },
    []
  );
  const setCurrentMousePosition = useCallback(() => {
    if (!stageRef.current) return;
    const position = stageRef.current.getPointerPosition();

    if (!position) return;

    const relative = getRelativePosition(position, imageRef.current);

    if (!relative) return;

    setPositionByStage(getRelativePosition(position, stageRef.current));

    let adjustedX: number;
    let adjustedY: number;
    let xOut: boolean;
    let yOut: boolean;

    if (relative.x < 0) {
      adjustedX = 0;
      xOut = true;
    } else if (relative.x > originalImage.width) {
      adjustedX = originalImage.width;
      xOut = true;
    } else {
      adjustedX = relative.x;
      xOut = false;
    }

    if (relative.y < 0) {
      adjustedY = 0;
      yOut = true;
    } else if (relative.y > originalImage.height) {
      adjustedY = originalImage.height;
      yOut = true;
    } else {
      adjustedY = relative.y;
      yOut = false;
    }

    relative.x = Math.round(adjustedX);
    relative.y = Math.round(adjustedY);

    setAbsolutePosition(relative);
    setOutOfBounds(xOut || yOut);
  }, [stageRef, getRelativePosition, originalImage, imageRef]);

  useEffect(() => {
    if (!absolutePosition?.x || outOfBounds) return;

    let y: number;
    /* For some reason the full range of x values work, but only y < height  work
       and when x >= width - 1, only y < height - 1 works in getPixelXY
       */
    if (absolutePosition.x >= originalImage.width - 1) {
      y = Math.min(originalImage.height - 2, absolutePosition.y);
    } else {
      y = Math.min(originalImage.height - 1, absolutePosition.y);
    }

    const pixelColor = originalImage
      .getPixelXY(absolutePosition.x, y)
      .slice(0, -1);
    setPixelColor(pixelColor.join(", "));
  }, [originalImage, absolutePosition?.x, absolutePosition?.y, outOfBounds]);

  return {
    absolutePosition,
    positionByStage,
    outOfBounds,
    pixelColor,
    getPositionFromImage,
    setCurrentMousePosition,
  };
};
