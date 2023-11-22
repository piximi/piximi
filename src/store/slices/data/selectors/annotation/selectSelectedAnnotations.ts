import { createSelector } from "@reduxjs/toolkit";
import { selectSelectedAnnotationIds } from "store/slices/imageViewer";
import { selectAnnotationEntities } from "./annotationSelectors";
import { DecodedAnnotationType } from "types";
import { decodeAnnotation } from "utils/annotator";

export const selectSelectedAnnotations = createSelector(
  [selectSelectedAnnotationIds, selectAnnotationEntities],
  (selectedIds, annotationEntities): Array<DecodedAnnotationType> => {
    const selectedAnnotations = selectedIds.map((annotationId) => {
      const annotationObj = annotationEntities[annotationId];

      if (!annotationObj) return undefined;

      const decodedAnnotation =
        annotationObj.decodedMask === undefined
          ? decodeAnnotation(annotationEntities[annotationId])
          : (annotationEntities[annotationId] as DecodedAnnotationType);

      return decodedAnnotation;
    });

    return selectedAnnotations.filter(
      (ann) => ann !== undefined
    ) as Array<DecodedAnnotationType>;
  }
);
