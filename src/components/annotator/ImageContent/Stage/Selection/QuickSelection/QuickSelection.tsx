import { useLayoutEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { stageScaleSelector } from "store/image-viewer";

import { QuickAnnotationTool } from "annotator";

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

  const stageScale = useSelector(stageScaleSelector);

  if (!operator.currentMask) return null;

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Image
          image={image}
          scale={{ x: stageScale, y: stageScale }}
        />
      </ReactKonva.Group>
    </>
  );
};
