import * as _ from "lodash";
import { CategoryType } from "../../../../../../annotator/types/CategoryType";
import * as ReactKonva from "react-konva";
import React, { useEffect, useState } from "react";
import { AnnotationType } from "../../../../../../annotator/types/AnnotationType";
import { useSelector } from "react-redux";
import {
  categoriesSelector,
  stageScaleSelector,
} from "../../../../../../annotator/store/selectors";
import { imageWidthSelector } from "../../../../../../annotator/store/selectors/imageWidthSelector";
import { imageHeightSelector } from "../../../../../../annotator/store/selectors/imageHeightSelector";
import { toRGBA } from "../../../../../../annotator/image";
import { colorOverlayROI } from "../../../../../../annotator/image/imageHelper";

type AnnotationProps = {
  annotation: AnnotationType;
};

export const SelectedAnnotation = ({ annotation }: AnnotationProps) => {
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
    const color = toRGBA(fill, 0);
    const overlayMask = colorOverlayROI(
      annotation.mask,
      annotation.boundingBox,
      imageWidth,
      imageHeight,
      color
    );
    if (!overlayMask) return;
    setImageMask(overlayMask);
  }, [annotation.mask, fill]);

  return (
    <React.Fragment>
      <ReactKonva.Image
        image={imageMask}
        id={annotation.id}
        scale={{ x: stageScale, y: stageScale }}
        key={annotation.id}
        x={annotation.boundingBox[0] * stageScale}
        y={annotation.boundingBox[1] * stageScale}
        width={annotation.boundingBox[2] - annotation.boundingBox[0]}
        height={annotation.boundingBox[3] - annotation.boundingBox[1]}
      />
    </React.Fragment>
  );
};
