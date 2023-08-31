import { createSelector } from "@reduxjs/toolkit";
import { selectWorkingAnnotationId } from "store/imageViewer";
import { selectAnnotationEntities } from "./annotationSelectors";
import { DecodedAnnotationType } from "types";
import { decodeAnnotation } from "utils/annotator";

export const selectWorkingAnnotation = createSelector(
  [selectWorkingAnnotationId, selectAnnotationEntities],
  (annotationId, annotationEntities): DecodedAnnotationType | undefined => {
    if (!annotationId) return;
    return decodeAnnotation(annotationEntities[annotationId])!;
  }
);
