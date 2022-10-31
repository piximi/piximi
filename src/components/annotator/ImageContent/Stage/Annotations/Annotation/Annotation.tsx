import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";
import { hexToRGBA } from "utils/common/imageHelper";
import { colorOverlayROI } from "utils/common/imageHelper";

import { stageScaleSelector } from "store/image-viewer";

import { decodedAnnotationType, Shape } from "types";
import Konva from "konva";
import { Transformer } from "react-konva";

type AnnotationProps = {
  annotation: decodedAnnotationType;
  imageShape: Shape;
  fillColor: string;
  selected?: boolean;
};

export const Annotation = ({
  annotation,
  imageShape,
  fillColor,
  selected,
}: AnnotationProps) => {
  const trRef = useRef<Konva.Transformer | null>(null);
  const annotatorRef = useRef<Konva.Image | null>(null);
  const stageScale = useSelector(stageScaleSelector);

  const [imageWidth] = useState<number>(imageShape.width);
  const [imageHeight] = useState<number>(imageShape.height);

  const [imageMask, setImageMask] = useState<HTMLImageElement>();

  useEffect(() => {
    if (selected) {
      if (trRef && annotatorRef && trRef.current && annotatorRef.current) {
        console.log("draw");
        trRef.current.nodes([annotatorRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selected, annotatorRef, trRef]);

  useEffect(() => {
    const boxWidth = annotation.boundingBox[2] - annotation.boundingBox[0];
    const boxHeight = annotation.boundingBox[3] - annotation.boundingBox[1];
    if (!boxWidth || !boxHeight) return;
    if (Math.round(boxWidth) <= 0 || Math.round(boxHeight) <= 0) return;
    const color = hexToRGBA(fillColor, 0);
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

  useEffect(() => {
    const boxWidth = annotation.boundingBox[2] - annotation.boundingBox[0];
    const boxHeight = annotation.boundingBox[3] - annotation.boundingBox[1];

    console.log(
      `AnnotationComponent - scale: ${stageScale}; bboxW: ${boxWidth}, bboxH: ${boxHeight}; scaled-bboxW: ${
        boxWidth * stageScale
      }; scaled-bboxH: ${boxHeight * stageScale} ${annotation.boundingBox}`
    );
  });
  useEffect(() => {
    console.log(selected);
  });

  return (
    <>
      <ReactKonva.Image
        ref={annotatorRef}
        id={annotation.id}
        image={imageMask}
        x={annotation.boundingBox[0] * stageScale}
        y={annotation.boundingBox[1] * stageScale}
        width={Math.round(
          (annotation.boundingBox[2] - annotation.boundingBox[0]) * stageScale
        )}
        height={Math.round(
          (annotation.boundingBox[3] - annotation.boundingBox[1]) * stageScale
        )}
        onTransformEnd={(e) => {
          const node = annotatorRef.current;
          const scaleX = node?.scaleX();
          const scaleY = node?.scaleY();
          console.log(scaleX, scaleY);
        }}
      />
      {selected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};
