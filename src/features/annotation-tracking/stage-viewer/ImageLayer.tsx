import { useColoredImage } from "hooks/useColoredImage";
import React from "react";
import { Layer, Image as KonvaImage } from "react-konva";
import { useSelector } from "react-redux";
import { imageDataSelectors } from "store/data/selectors";
import { hasTensorReference } from "store/data/utils";
import { RootState } from "store/rootReducer";

import { Point } from "utils/types";

interface ImageLayerProps {
  htmlImages: Record<
    string,
    { image: HTMLImageElement; pos: Point; id: string }
  >;
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
          <RenderedKonvaImage
            width={globalShape.width}
            height={globalShape.height}
            id={image.id}
            pos={image.pos}
            key={`track-viewer-image-${idx}`}
          />
        );
      })}
    </Layer>
  );
};

const RenderedKonvaImage = ({
  id,
  pos,
  width,
  height,
}: {
  id: string;
  pos: Point;
  width: number;
  height: number;
}) => {
  const image = useSelector((state: RootState) =>
    imageDataSelectors.selectById(state, id),
  );
  if (!hasTensorReference(image)) return null;
  const { coloredImage, loading } = useColoredImage(image);
  if (!coloredImage || loading) return null;
  return (
    <KonvaImage
      width={width}
      height={height}
      image={coloredImage}
      position={pos}
      fill="black"
      opacity={1}
    />
  );
};
