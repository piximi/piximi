import React, { useEffect, useState } from "react";
import { CategoryType } from "../../../../../../../annotator/types/CategoryType";
import * as ReactKonva from "react-konva";
import * as _ from "lodash";
import { AnnotationType } from "../../../../../../../annotator/types/AnnotationType";
import { useSelector } from "react-redux";
import {
  categoriesSelector,
  stageScaleSelector,
} from "../../../../../../../annotator/store/selectors";
import { colorOverlayROI } from "../../../../../../../annotator/image/imageHelper";
import { imageWidthSelector } from "../../../../../../../annotator/store/selectors/imageWidthSelector";
import { imageHeightSelector } from "../../../../../../../annotator/store/selectors/imageHeightSelector";
import { toRGBA } from "../../../../../../../annotator/image";

type AnnotationProps = {
  annotation: AnnotationType;
};

export const Annotation = ({ annotation }: AnnotationProps) => {
  const categories = useSelector(categoriesSelector);
  const stageScale = useSelector(stageScaleSelector);

  const imageWidth = useSelector(imageWidthSelector);
  const imageHeight = useSelector(imageHeightSelector);

  const [imageMask, setImageMask] = useState<HTMLImageElement>();

  const fill = _.find(
    categories,
    (category: CategoryType) => category.id === annotation.categoryId
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
        color
      )
    );
  }, [annotation.mask, fill]);

  if (!annotation) return <></>;

  return (
    <>
      {/*// @ts-ignore */}
      <ReactKonva.Group>
        {/*// @ts-ignore */}
        <ReactKonva.Image
          id={annotation.id}
          image={imageMask}
          scale={{ x: stageScale, y: stageScale }}
          x={annotation.boundingBox[0] * stageScale}
          y={annotation.boundingBox[1] * stageScale}
        />
      </ReactKonva.Group>
    </>
  );
};
