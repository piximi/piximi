import { useLayoutEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Group as KonvaGroup, Image as KonvaImage } from "react-konva";

import { ColorAnnotationToolTip } from "../../ColorAnnotationToolTip";

import { selectImageOrigin } from "views/ImageViewer/state/imageViewer/selectors";

import { ColorAnnotationTool } from "views/ImageViewer/utils/tools";

type ColorSelectionProps = {
  operator: ColorAnnotationTool;
};

export const ColorSelection = ({ operator }: ColorSelectionProps) => {
  const [image, setImage] = useState<HTMLImageElement>();
  const imagePosition = useSelector(selectImageOrigin);

  useLayoutEffect(() => {
    let timerId: number;
    const f = () => {
      timerId = requestAnimationFrame(f);
      const image = new Image();
      image.src = operator.overlayData;
      setImage(image);
    };

    timerId = requestAnimationFrame(f);

    return () => cancelAnimationFrame(timerId);
  });

  if (!operator.overlayData || !operator.offset) return null;

  return (
    <>
      <KonvaGroup>
        <KonvaImage image={image} x={imagePosition.x} y={imagePosition.y} />
      </KonvaGroup>
      <ColorAnnotationToolTip
        toolTipPosition={{
          x: operator.toolTipPosition!.x + imagePosition.x,
          y: operator.toolTipPosition!.y + imagePosition.y,
        }}
        initialPosition={operator.origin}
        imageOrigin={imagePosition}
        tolerance={operator.tolerance}
      />
    </>
  );
};
