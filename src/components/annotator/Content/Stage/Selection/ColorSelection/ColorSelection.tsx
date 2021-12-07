import { ColorAnnotationTool } from "../../../../../../annotator/image/Tool";
import * as ReactKonva from "react-konva";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { stageScaleSelector } from "../../../../../../store/selectors";

type ColorSelectionProps = {
  operator: ColorAnnotationTool;
};

export const ColorSelection = ({ operator }: ColorSelectionProps) => {
  const [image, setImage] = useState<HTMLImageElement>();

  const stageScale = useSelector(stageScaleSelector);

  useEffect(() => {
    const image = new Image();
    image.src = operator.overlayData;
    setImage(image);
  }, [operator.overlayData]);

  if (!operator.overlayData || !operator.offset) return null;

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
