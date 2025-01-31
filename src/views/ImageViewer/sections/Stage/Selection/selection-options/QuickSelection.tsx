import { useLayoutEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Group as KonvaGroup, Image as KonvaImage } from "react-konva";

import { selectImageOrigin } from "views/ImageViewer/state/imageViewer/selectors";

import { QuickAnnotationTool } from "views/ImageViewer/utils/tools";

type QuickSelectionProps = {
  operator: QuickAnnotationTool;
};

export const QuickSelection = ({ operator }: QuickSelectionProps) => {
  const [image, setImage] = useState<HTMLImageElement>();
  const imageOrigin = useSelector(selectImageOrigin);

  useLayoutEffect(() => {
    let timerId: number;
    const f = () => {
      timerId = requestAnimationFrame(f);
      const image = new Image();
      image.src = operator.currentMask
        ? operator.currentMask.toDataURL("image/png", {
            useCanvas: true,
          })
        : "";
      setImage(image);
    };

    timerId = requestAnimationFrame(f);

    return () => cancelAnimationFrame(timerId);
  });

  if (!operator.currentMask) return null;

  return (
    <>
      <KonvaGroup>
        <KonvaImage image={image} x={imageOrigin.x} y={imageOrigin.y} />
      </KonvaGroup>
    </>
  );
};
