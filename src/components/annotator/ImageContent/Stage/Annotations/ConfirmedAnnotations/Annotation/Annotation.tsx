import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { colorOverlayROI } from "utils/common/imageHelper";

import { stageScaleSelector } from "store/image-viewer";

import { bufferedAnnotationType, Shape } from "types";
import { toRGBA } from "utils/annotator";

type AnnotationProps = {
  annotation: bufferedAnnotationType;
  imageShape: Shape;
  fillColor: string;
};

export const Annotation = ({
  annotation,
  imageShape,
  fillColor,
}: AnnotationProps) => {
  const stageScale = useSelector(stageScaleSelector);

  const [imageWidth] = useState<number>(imageShape.width);
  const [imageHeight] = useState<number>(imageShape.height);

  const [imageMask, setImageMask] = useState<HTMLImageElement>();

  useEffect(() => {
    const boxWidth = annotation.boundingBox[2] - annotation.boundingBox[0];
    const boxHeight = annotation.boundingBox[3] - annotation.boundingBox[1];
    if (!boxWidth || !boxHeight) return;
    if (Math.round(boxWidth) <= 0 || Math.round(boxHeight) <= 0) return;
    const color = toRGBA(fillColor, 0);
    setImageMask(
      colorOverlayROI(
        annotation.maskData,
        annotation.boundingBox,
        imageWidth,
        imageHeight,
        color,
        stageScale
      )
    );
  }, [
    annotation.maskData,
    fillColor,
    annotation.boundingBox,
    stageScale,
    imageWidth,
    imageHeight,
  ]);

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Image
          id={annotation.id}
          image={imageMask}
          x={annotation.boundingBox[0] * stageScale}
          y={annotation.boundingBox[1] * stageScale}
        />
      </ReactKonva.Group>
    </>
  );
};
