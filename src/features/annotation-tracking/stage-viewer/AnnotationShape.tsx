import React, { useMemo } from "react";
import { Image as KonvaImage } from "react-konva";

import { colorOverlayROI, hexToRGBA } from "views/ImageViewer/utils";
import { AnnotationProps } from "../utils/types";

/**
 * Renders a single annotation as a Konva image with colored overlay.
 * Memoized to prevent unnecessary re-renders when parent re-renders.
 */
export const AnnotationShape = React.memo(
  ({
    annotation,
    imageShape,
    imagePosition,
    fillColor,
    isFiltered,
    onSelect,
  }: AnnotationProps) => {
    const imageWidth = useMemo(() => imageShape.width, [imageShape]);
    const imageHeight = useMemo(() => imageShape.height, [imageShape]);

    const imageMask = useMemo(() => {
      const boxWidth = annotation.boundingBox[2] - annotation.boundingBox[0];
      const boxHeight = annotation.boundingBox[3] - annotation.boundingBox[1];
      if (!boxWidth || !boxHeight || !annotation.decodedMask) return;
      if (Math.round(boxWidth) <= 0 || Math.round(boxHeight) <= 0) return;

      const color = hexToRGBA(fillColor, 0);

      return colorOverlayROI(
        annotation.decodedMask,
        annotation.boundingBox,
        imageWidth,
        imageHeight,
        color,
        1,
      );
    }, [
      annotation.decodedMask,
      fillColor,
      annotation.boundingBox,
      imageWidth,
      imageHeight,
    ]);

    return (
      <KonvaImage
        id={annotation.id}
        image={imageMask}
        x={annotation.boundingBox[0] + imagePosition.x}
        y={annotation.boundingBox[1] + imagePosition.y}
        width={Math.round(
          annotation.boundingBox[2] - annotation.boundingBox[0],
        )}
        height={Math.round(
          annotation.boundingBox[3] - annotation.boundingBox[1],
        )}
        strokeWidth={100}
        fillPatternX={20}
        visible={!isFiltered}
        onClick={onSelect}
        name="annotation"
      />
    );
  },
);
