import { useLayoutEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { selectImageOrigin } from "store/imageViewer/selectors";

import { QuickAnnotationTool } from "utils/annotator/tools";

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
      <ReactKonva.Group>
        <ReactKonva.Image image={image} x={imageOrigin.x} y={imageOrigin.y} />
      </ReactKonva.Group>
    </>
  );
};
