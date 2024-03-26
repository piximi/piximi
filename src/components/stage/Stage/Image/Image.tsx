import React, { forwardRef, useState } from "react";
import { useSelector } from "react-redux";
import Konva from "konva";

import { selectImageOrigin } from "store/slices/imageViewer";
import {
  selectActiveImageActivePlane,
  selectActiveImageWidth,
  selectActiveImageHeight,
} from "store/slices/data";

import { MemoizedKonvaImage } from "./MemoizedKonvaImage";

export const Image = forwardRef<
  Konva.Image,
  { stageWidth: number; stageHeight: number; images: HTMLImageElement[] }
>(({ stageWidth, stageHeight, images }, ref) => {
  const activePlane = useSelector(selectActiveImageActivePlane)!;
  const width = useSelector(selectActiveImageWidth);
  const height = useSelector(selectActiveImageHeight);
  const [filters] = useState<Array<any>>();
  const imagePosition = useSelector(selectImageOrigin);
  return (
    <>
      {images.map((image, idx) => (
        <MemoizedKonvaImage
          image={image}
          height={height!}
          width={width!}
          imagePosition={imagePosition!}
          activePlane={activePlane}
          filters={filters!}
          idx={idx}
          key={idx}
          ref={ref}
        />
      ))}
    </>
  );
});
