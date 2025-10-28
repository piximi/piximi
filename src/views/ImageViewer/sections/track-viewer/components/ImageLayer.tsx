import React from "react";
import { Layer, Image as KonvaImage } from "react-konva";

import { Point } from "utils/types";

interface ImageLayerProps {
  htmlImages: Record<string, { image: HTMLImageElement; pos: Point }>;
  globalShape: { width: number; height: number };
}

/**
 * A Konva layer that renders all timepoint images in the track viewer.
 * Images are positioned horizontally with appropriate spacing.
 */
export const ImageLayer: React.FC<ImageLayerProps> = ({
  htmlImages,
  globalShape,
}) => {
  return (
    <Layer>
      {Object.values(htmlImages).map((image, idx) => {
        return (
          <KonvaImage
            width={globalShape.width}
            height={globalShape.height}
            image={image.image}
            position={image.pos}
            key={`track-viewer-image-${idx}`}
            fill="black"
            opacity={1}
          />
        );
      })}
    </Layer>
  );
};
