import { createSelector } from "@reduxjs/toolkit";
import { selectActiveAnnotationIds } from "store/slices/imageViewer";
import { selectAnnotationEntities } from "./annotationSelectors";
import { DecodedAnnotationType } from "types";
import { decodeAnnotation } from "utils/annotator";

export const selectActiveAnnotations = createSelector(
  [selectActiveAnnotationIds, selectAnnotationEntities],
  (annotationIds, annotationEntities): Array<DecodedAnnotationType> => {
    if (!annotationIds.length) return [];

    return annotationIds.map((annotationId) => {
      const decodedAnnotation = !annotationEntities[annotationId].decodedMask
        ? decodeAnnotation(annotationEntities[annotationId])
        : (annotationEntities[annotationId] as DecodedAnnotationType);
      return decodedAnnotation;
    });
  }
);

export const selectActiveAnnotationIdsByCategory = createSelector(
  [selectActiveAnnotations, (_, categoryId) => categoryId],
  (activeAnnotations, categoryId) => {
    return activeAnnotations.reduce((ids: string[], annotation) => {
      if (annotation.categoryId === categoryId) {
        ids.push(annotation.id);
      }
      return ids;
    }, []);
  }
);
export const selectActiveAnnotationCountsByCategory = createSelector(
  selectActiveAnnotations,
  (annotations) => {
    const countsByCategory: Record<string, number> = {};
    for (const annotation of annotations) {
      const category = annotation.categoryId;
      if (Object.keys(countsByCategory).includes(category)) {
        countsByCategory[category]++;
      } else {
        countsByCategory[category] = 1;
      }
    }
    return countsByCategory;
  }
);
