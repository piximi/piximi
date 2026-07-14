import { useState, forwardRef, memo, useMemo, useEffect } from "react";

import { useSelector } from "react-redux";
import { Image as KonvaImage } from "react-konva";

import { selectImageOrigin } from "views/ImageViewer/state/imageViewer/selectors";
import { selectActiveImage } from "views/ImageViewer/state/annotator/reselectors";

import type { Point } from "utils/types";

import type Konva from "konva";
import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectExtendedImageById } from "store/dataV2/selectors";
import { useRenderedSrc } from "hooks/useRenderedSrcs";
import { Layer } from "./Layer";

interface KonvaImageProps {
  image: HTMLImageElement;
  height: number;
  width: number;
  imagePosition: Point;
  activePlane: number;
  filters: any[];
  idx: number;
}

const MemoizedKonvaImage = memo(
  forwardRef<Konva.Image, KonvaImageProps>((props, ref) => {
    return (
      <KonvaImage
        height={props.height}
        image={props.image}
        ref={ref}
        width={props.width}
        filters={props.filters}
        visible={props.idx === props.activePlane}
        position={props.imagePosition}
        key={props.idx}
      />
    );
  }),
);

const Image = forwardRef<
  Konva.Image,
  { stageWidth: number; stageHeight: number; images: HTMLImageElement[] }
>(({ stageWidth: _stageWidth, stageHeight: _stageHeight, images }, ref) => {
  const activeImage = useSelector(selectActiveImage);
  const [filters] = useState<Array<any>>();
  const imagePosition = useSelector(selectImageOrigin);
  return (
    <>
      {images.map((image, idx) => (
        <MemoizedKonvaImage
          image={image}
          // 100 for no particular reason; shouldn't happen
          height={activeImage?.shape.height || 100}
          width={activeImage?.shape.width || 100}
          imagePosition={imagePosition!}
          activePlane={activeImage?.activePlane || 0}
          filters={filters!}
          idx={idx}
          key={idx}
          ref={ref}
        />
      ))}
    </>
  );
});

export const ImageLayer = memo(
  forwardRef<Konva.Image, { htmlImage: HTMLImageElement }>(
    ({ htmlImage }, ref) => {
      const activeImageId = useSelector(selectActiveImageId);
      const image = useParameterizedSelector(
        selectExtendedImageById,
        activeImageId ?? "",
      );
      const imagePosition = useSelector(selectImageOrigin);
      const { src } = useRenderedSrc(image?.channelsRef ?? []);

      return image && htmlImage ? (
        <Layer>
          <KonvaImage
            height={image.shape.height}
            image={htmlImage}
            ref={ref}
            width={image.shape.width}
            position={imagePosition}
          />
        </Layer>
      ) : null;
    },
  ),
);
