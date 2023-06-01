import { createSelector } from "@reduxjs/toolkit";
import { selectSelectedAnnotationIds } from "store/imageViewer";
import { selectAnnotationEntities } from "./annotationSelectors";
import { DecodedAnnotationType } from "types";
import { decodeAnnotation } from "utils/annotator";

export const selectSelectedAnnotations = createSelector(
  [selectSelectedAnnotationIds, selectAnnotationEntities],
  (selectedIds, annotationEntities): Array<DecodedAnnotationType> => {
    return selectedIds.map(
      (annotationId) => decodeAnnotation(annotationEntities[annotationId]!)!
    );
  }
);
