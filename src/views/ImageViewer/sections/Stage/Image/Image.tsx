import React, { useState } from "react";
import { useSelector } from "react-redux";
import Konva from "konva";

import { MemoizedKonvaImage } from "./MemoizedKonvaImage";

import { selectImageOrigin } from "views/ImageViewer/state/imageViewer/selectors";
import { selectActiveImage } from "views/ImageViewer/state/imageViewer/reselectors";

export const Image = React.forwardRef<
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
