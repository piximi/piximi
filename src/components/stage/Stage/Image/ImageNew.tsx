import React, { forwardRef, useState } from "react";
import { useSelector } from "react-redux";
import Konva from "konva";

import { selectImageOrigin } from "store/imageViewer";

import { selectActiveImage } from "store/imageViewer/reselectors";
import { MemoizedKonvaImage } from "./MemoizedKonvaImage";

export const ImageNew = forwardRef<
  Konva.Image,
  { stageWidth: number; stageHeight: number; images: HTMLImageElement[] }
>(({ stageWidth, stageHeight, images }, ref) => {
  const activeImage = useSelector(selectActiveImage);
  const [filters] = useState<Array<any>>();
  const imagePosition = useSelector(selectImageOrigin);
  return (
    <>
      {images.map((image, idx) => (
        <MemoizedKonvaImage
          image={image}
          height={activeImage?.shape.height!}
          width={activeImage?.shape.width!}
          imagePosition={imagePosition!}
          activePlane={activeImage?.activePlane!}
          filters={filters!}
          idx={idx}
          key={idx}
          ref={ref}
        />
      ))}
    </>
  );
});
