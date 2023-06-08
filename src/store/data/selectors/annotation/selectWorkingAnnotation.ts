import { createSelector } from "@reduxjs/toolkit";
import { workingAnnotationIdSelector } from "store/imageViewer";
import { selectAnnotationEntities } from "./annotationSelectors";
import { AnnotationType, EncodedAnnotationType } from "types";
import { decodeAnnotation } from "utils/annotator";

export const selectWorkingAnnotation = createSelector(
  [workingAnnotationIdSelector, selectAnnotationEntities],
  (annotationId, annotationEntities): AnnotationType | undefined => {
    if (!annotationId) return;
    return decodeAnnotation(
      annotationEntities[annotationId]! as EncodedAnnotationType
    )!;
  }
);
