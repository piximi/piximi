import React, { useEffect, useState } from "react";
import { Category } from "../../../../../../../types/Category";
import * as ReactKonva from "react-konva";
import * as _ from "lodash";
import { AnnotationType } from "../../../../../../../types/AnnotationType";
import { useSelector } from "react-redux";
import { stageScaleSelector } from "../../../../../../../store/selectors";
import { colorOverlayROI } from "../../../../../../../image/imageHelper";
import { imageWidthSelector } from "../../../../../../../store/selectors/imageWidthSelector";
import { imageHeightSelector } from "../../../../../../../store/selectors/imageHeightSelector";
import { toRGBA } from "../../../../../../../annotator/image";
import { annotatorCategoriesSelector } from "../../../../../../../store/selectors/annotatorCategoriesSelector";

type AnnotationProps = {
  annotation: AnnotationType;
};

export const Annotation = ({ annotation }: AnnotationProps) => {
  const categories = useSelector(annotatorCategoriesSelector);
  const stageScale = useSelector(stageScaleSelector);

  const imageWidth = useSelector(imageWidthSelector);
  const imageHeight = useSelector(imageHeightSelector);

  const [imageMask, setImageMask] = useState<HTMLImageElement>();

  const fill = _.find(
    categories,
    (category: Category) => category.id === annotation.categoryId
  )?.color;

  useEffect(() => {
    if (!annotation.mask || !imageWidth || !imageHeight) return;
    if (!fill) return;
    const boxWidth = annotation.boundingBox[2] - annotation.boundingBox[0];
    const boxHeight = annotation.boundingBox[3] - annotation.boundingBox[1];
    if (!boxWidth || !boxHeight) return;
    if (Math.round(boxWidth) <= 0 || Math.round(boxHeight) <= 0) return;
    const color = toRGBA(fill, 0);
    setImageMask(
      colorOverlayROI(
        annotation.mask,
        annotation.boundingBox,
        imageWidth,
        imageHeight,
        color,
        stageScale
      )
    );
  }, [
    annotation.mask,
    fill,
    annotation.boundingBox,
    imageWidth,
    imageHeight,
    stageScale,
  ]);

  if (!annotation) return <></>;

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
