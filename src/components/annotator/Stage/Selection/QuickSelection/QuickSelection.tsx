import { useLayoutEffect, useState } from "react";
import * as ReactKonva from "react-konva";

import { QuickAnnotationTool } from "annotator-tools";
import { useImageOrigin } from "hooks";

type QuickSelectionProps = {
  operator: QuickAnnotationTool;
};

export const QuickSelection = ({ operator }: QuickSelectionProps) => {
  const [image, setImage] = useState<HTMLImageElement>();

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

  const imageOrigin = useImageOrigin();

  if (!operator.currentMask) return null;

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Image image={image} x={imageOrigin.x} y={imageOrigin.y} />
      </ReactKonva.Group>
    </>
  );
};
