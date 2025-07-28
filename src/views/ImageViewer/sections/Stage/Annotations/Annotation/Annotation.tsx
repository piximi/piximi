import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Konva from "konva";
import { Image as KonvaImage } from "react-konva";
import Image from "image-js";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectImageOrigin } from "views/ImageViewer/state/imageViewer/selectors";

import { hexToRGBA, colorOverlayROI, encode } from "views/ImageViewer/utils";

import { ProtoAnnotationObject } from "views/ImageViewer/utils/types";
import { Shape } from "store/data/types";

type AnnotationProps = {
  annotation: ProtoAnnotationObject;
  imageShape: Shape;
  fillColor: string;
  selected?: boolean;
  isFiltered?: boolean;
};

export const Annotation = React.memo(
  ({
    annotation,
    imageShape,
    fillColor,
    selected,
    isFiltered,
  }: AnnotationProps) => {
    const annotatorRef = useRef<Konva.Image | null>(null);
    const [imageWidth] = useState<number>(imageShape.width);
    const [imageHeight] = useState<number>(imageShape.height);
    const [imageMask, setImageMask] = useState<HTMLImageElement>();
    const imagePosition = useSelector(selectImageOrigin);
    const dispatch = useDispatch();

    useEffect(() => {
      const boxWidth = annotation.boundingBox[2] - annotation.boundingBox[0];
      const boxHeight = annotation.boundingBox[3] - annotation.boundingBox[1];
      if (!boxWidth || !boxHeight || !annotation.decodedMask) return;
      if (Math.round(boxWidth) <= 0 || Math.round(boxHeight) <= 0) return;
      console.log(fillColor);

      const color = hexToRGBA(fillColor, 0);
      console.log(color);
      setImageMask(
        colorOverlayROI(
          annotation.decodedMask,
          annotation.boundingBox,
          imageWidth,
          imageHeight,
          color,
          1,
        ),
      );
    }, [
      annotation.decodedMask,
      fillColor,
      annotation.boundingBox,
      imageWidth,
      imageHeight,
    ]);

    //TODO: Remove Transformations on annotations
    const onTransformEnd = () => {
      if (!selected || !imageWidth || !imageHeight || !annotation.decodedMask)
        return;

      const node = annotatorRef.current;
      if (!node) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      if (!scaleX || !scaleY) return;

      const decodedMask = annotation.decodedMask;
      const boundingBox = annotation.boundingBox;

      const roiWidth = boundingBox[2] - boundingBox[0];
      const roiHeight = boundingBox[3] - boundingBox[1];

      if (!roiWidth || !roiHeight) return;

      const roi = new Image(roiWidth, roiHeight, decodedMask, {
        components: 1,
        alpha: 0,
      });

      const resizedMaskROI = roi.resize({
        height: Math.round(roiHeight * scaleY),
        width: Math.round(roiWidth * scaleX),
        preserveAspectRatio: false,
      });
      const stageScaledX = Math.round(node.x()) - imagePosition.x;
      const stageScaleY = Math.round(node.y()) - imagePosition.y;

      const updatedAnnotation = {
        ...annotation,
        boundingBox: [
          stageScaledX,
          stageScaleY,
          stageScaledX + resizedMaskROI.width,
          stageScaleY + resizedMaskROI.height,
        ] as [number, number, number, number],
        decodedMask: Uint8Array.from(resizedMaskROI.data),
      };

      const tempUpdated = {
        ...updatedAnnotation,
        encodedMask: encode(resizedMaskROI.data),
      };

      dispatch(
        annotatorSlice.actions.editThings({
          updates: [tempUpdated],
        }),
      );
    };

    return isFiltered ? (
      <></>
    ) : (
      <KonvaImage
        ref={annotatorRef}
        id={annotation.id}
        image={imageMask}
        x={annotation.boundingBox[0] + imagePosition.x}
        y={annotation.boundingBox[1] + imagePosition.y}
        width={Math.round(
          annotation.boundingBox[2] - annotation.boundingBox[0],
        )}
        height={Math.round(
          annotation.boundingBox[3] - annotation.boundingBox[1],
        )}
        onTransformEnd={onTransformEnd}
        strokeWidth={100}
        fillPatternX={20}

        //scale={{ x: stageScale, y: stageScale }}
      />
    );
  },
);
