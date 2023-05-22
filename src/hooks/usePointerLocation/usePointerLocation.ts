import { useCallback, useEffect, useState } from "react";
import Konva from "konva";
import * as ImageJS from "image-js";
import { Point } from "types";

export const usePointerLocation = (
  imageRef: React.MutableRefObject<Konva.Image | null>,
  stageRef: React.RefObject<Konva.Stage | null>,
  originalImage: ImageJS.Image | undefined
) => {
  const [absolutePosition, setAbsolutePosition] = useState<Point>();
  const [positionByStage, setPositionByStage] = useState<Point>();
  const [outOfBounds, setOutOfBounds] = useState<boolean>(false);
  const [pixelColor, setPixelColor] = useState<string>();

  const getPositionFromImage = useCallback(
    (position: Point): Point | undefined => {
      if (!imageRef || !imageRef.current || !originalImage) return;

      const transform = imageRef.current.getAbsoluteTransform().copy();

      transform.invert();

      const imageOffset = transform.point(position);

      return {
        x: (imageOffset.x / imageRef.current.width()) * originalImage?.width,
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
    if (!stageRef.current || !originalImage) return;
    const position = stageRef.current.getPointerPosition();

    if (!position) return;

    const relative = getRelativePosition(position, imageRef.current);

    if (!relative) return;

    setPositionByStage(getRelativePosition(position, stageRef.current));

    const absolute = {
      x: Math.round(relative.x),
      y: Math.round(relative.y),
    };

    if (
      absolute.x < 0 ||
      absolute.x > originalImage.width ||
      absolute.y < 0 ||
      absolute.y > originalImage.height
    ) {
      setOutOfBounds(true);
      absolute.x =
        absolute.x < 0
          ? 0
          : absolute.x > originalImage.width
          ? originalImage.width
          : absolute.x;
      absolute.y =
        absolute.y < 0
          ? 0
          : absolute.y > originalImage.height
          ? originalImage.height
          : absolute.y;
    } else {
      setOutOfBounds(false);
    }

    setAbsolutePosition(absolute);
  }, [stageRef, getRelativePosition, originalImage, imageRef]);
  useEffect(() => {
    if (!absolutePosition?.x || outOfBounds || !originalImage) return;

    let y: number;
    /* For some reason the full range of x values work, but only y < height  work
       and when x >= width - 1, only y < height - 1 works in getPixelXY
       */
    if (absolutePosition.x >= originalImage.width - 1) {
      y = Math.min(originalImage.height - 2, absolutePosition.y);
    } else {
      y = Math.min(originalImage.height - 1, absolutePosition.y);
    }
    setPixelColor(
      `${originalImage
        .getPixelXY(absolutePosition.x, y)
        .reduce((prev, next) => {
          return prev + `${next}, `;
        }, "")
        .slice(0, -2)}`
    );
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
