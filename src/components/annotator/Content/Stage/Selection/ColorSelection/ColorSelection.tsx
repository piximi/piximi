import { useLayoutEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { ColorAnnotationToolTip } from "../../ColorAnnotationToolTip";

import { stageScaleSelector } from "store/selectors";

import { ColorAnnotationTool } from "annotator/image/Tool";

type ColorSelectionProps = {
  operator: ColorAnnotationTool;
};

export const ColorSelection = ({ operator }: ColorSelectionProps) => {
  const [image, setImage] = useState<HTMLImageElement>();

  const stageScale = useSelector(stageScaleSelector);

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
      <ReactKonva.Group>
        <ReactKonva.Image
          image={image}
          scale={{ x: stageScale, y: stageScale }}
        />
      </ReactKonva.Group>
      <ColorAnnotationToolTip
        toolTipPosition={operator.toolTipPosition}
        initialPosition={operator.initialPosition}
        tolerance={operator.tolerance}
      />
    </>
  );
};
