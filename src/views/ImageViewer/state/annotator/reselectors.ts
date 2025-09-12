import { createSelector } from "@reduxjs/toolkit";

import { selectWorkingAnnotationEntity } from "./selectors";
import { selectCategoryEntities } from "store/data/selectors";

import { decodeAnnotation } from "views/ImageViewer/utils/rle";
import { getCompleteEntity } from "./utils";

import { AnnotationObject } from "store/data/types";

import { ProtoAnnotationObject } from "../types";
import { selectActiveImage } from "../image-viewer-data/reselectors";

export const selectFullWorkingAnnotation = createSelector(
  selectWorkingAnnotationEntity,

  (workingAnnotationEntity) => {
    if (!workingAnnotationEntity.saved) return;
    return {
      ...workingAnnotationEntity.saved,
      ...workingAnnotationEntity.changes,
    } as ProtoAnnotationObject;
  },
);
export const selectWorkingAnnotationView = createSelector(
  selectWorkingAnnotationEntity,
  selectActiveImage,
  selectCategoryEntities,
  (workingAnnotationEntity, activeImage, catDict) => {
    if (!workingAnnotationEntity.saved || !activeImage) return;
    const workingAnnotation = getCompleteEntity(
      workingAnnotationEntity,
    ) as AnnotationObject;
    const annotation = !workingAnnotation.decodedMask
      ? decodeAnnotation(workingAnnotation)
      : (workingAnnotation as ProtoAnnotationObject);
    const fillColor = catDict[workingAnnotation.categoryId].color;
    return {
      annotation: annotation,
      fillColor: fillColor,
      imageShape: activeImage.shape,
    };
  },
);
