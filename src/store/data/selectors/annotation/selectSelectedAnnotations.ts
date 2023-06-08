import { createSelector } from "@reduxjs/toolkit";
import { selectSelectedAnnotationIds } from "store/imageViewer";
import { selectAnnotationEntities } from "./annotationSelectors";
import { AnnotationType, EncodedAnnotationType } from "types";
import { decodeAnnotation } from "utils/annotator";

export const selectSelectedAnnotations = createSelector(
  [selectSelectedAnnotationIds, selectAnnotationEntities],
  (selectedIds, annotationEntities): Array<AnnotationType> => {
    return selectedIds.map(
      (annotationId) =>
        decodeAnnotation(
          annotationEntities[annotationId]! as EncodedAnnotationType
        )!
    );
  }
);
