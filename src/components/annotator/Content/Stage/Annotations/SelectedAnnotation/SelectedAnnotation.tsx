import * as ReactKonva from "react-konva";
import { useEffect, useState } from "react";
import { AnnotationType } from "../../../../../../types/AnnotationType";
import { useSelector } from "react-redux";
import { stageScaleSelector } from "../../../../../../store/selectors";
import { toRGBA } from "../../../../../../annotator/image";
import { colorOverlayROI } from "../../../../../../image/imageHelper";
import { Shape } from "types/Shape";

type AnnotationProps = {
  annotation: AnnotationType;
  imageShape: Shape;
  fillColor: string;
};

export const SelectedAnnotation = ({
  annotation,
  imageShape,
  fillColor,
}: AnnotationProps) => {
  const stageScale = useSelector(stageScaleSelector);

  const [imageWidth] = useState<number>(imageShape.width);
  const [imageHeight] = useState<number>(imageShape.height);

  const [imageMask, setImageMask] = useState<HTMLImageElement>();

  useEffect(() => {
    const color = toRGBA(fillColor, 0);
    const overlayMask = colorOverlayROI(
      annotation.mask,
      annotation.boundingBox,
      imageWidth,
      imageHeight,
      color,
      stageScale
    );
    if (!overlayMask) return;
    setImageMask(overlayMask);
  }, [
    annotation.mask,
    fillColor,
    annotation.boundingBox,
    imageHeight,
    imageWidth,
    stageScale,
  ]);

  return (
    <>
      <ReactKonva.Image
        image={imageMask}
        id={annotation.id}
        key={annotation.id}
        x={annotation.boundingBox[0] * stageScale}
        y={annotation.boundingBox[1] * stageScale}
        width={Math.round(
          (annotation.boundingBox[2] - annotation.boundingBox[0]) * stageScale
        )}
        height={Math.round(
          (annotation.boundingBox[3] - annotation.boundingBox[1]) * stageScale
        )}
      />
    </>
  );
};
