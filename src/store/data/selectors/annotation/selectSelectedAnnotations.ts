import { createSelector } from "@reduxjs/toolkit";
import { selectSelectedAnnotationIds } from "store/imageViewer";
import { selectAnnotationEntities } from "./annotationSelectors";
import { AnnotationType, EncodedAnnotationType } from "types";
import { decodeAnnotation } from "utils/annotator";

export const selectSelectedAnnotations = createSelector(
  [selectSelectedAnnotationIds, selectAnnotationEntities],
  (selectedIds, annotationEntities): Array<AnnotationType> => {
    const selectedAnnotations = selectedIds.map((annotationId) => {
      const annotationObj = annotationEntities[annotationId];

      if (!annotationObj) return undefined;

      const decodedAnnotation =
        annotationObj.decodedMask === undefined
          ? decodeAnnotation(
              annotationEntities[annotationId] as EncodedAnnotationType
            )!
          : (annotationEntities[annotationId] as AnnotationType);
      return decodedAnnotation;
    });

    return selectedAnnotations.filter(
      (ann) => ann !== undefined
    ) as Array<AnnotationType>;
  }
);
