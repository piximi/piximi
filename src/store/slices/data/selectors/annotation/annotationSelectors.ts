import { createSelector } from "@reduxjs/toolkit";

import { annotationsAdapter } from "../../dataSlice";
import { RootState } from "store/rootReducer";

import { Data, AnnotationType } from "types";

const annotationSelectors = annotationsAdapter.getSelectors(
  (state: RootState) => state.data.annotations
);

export const selectAnnotationEntities = annotationSelectors.selectEntities;
export const selectAllAnnotations = annotationSelectors.selectAll;
export const selectAllAnnotationIds = annotationSelectors.selectIds;
export const selectAnnotationById = annotationSelectors.selectEntities;
export const selectTotalAnnotationCount = annotationSelectors.selectTotal;

export const selectAnnotationsByImageDict = ({ data }: { data: Data }) => {
  return data.annotationsByImage;
};

export const selectAnnotationsByCategoryDict = ({ data }: { data: Data }) => {
  return data.annotationsByCategory;
};

export const selectAnnotationIdsByImage = createSelector(
  [selectAnnotationsByImageDict, (state, imageId: string) => imageId],
  (annotationsByImage, imageId) => {
    return annotationsByImage[imageId];
  }
);

export const selectTotalAnnotationCountByImage = createSelector(
  [
    selectAnnotationsByImageDict,
    selectAllAnnotationIds,
    (state, imageId) => imageId,
  ],
  (annotationsByImage, annotationIds, imageId) => {
    let count = 0;

    for (const id of annotationsByImage[imageId]) {
      if (annotationIds.includes(id)) {
        count++;
      }
    }

    return count;
  }
);

export const selectAnnotationCountByCategory = () =>
  createSelector(
    [selectAllAnnotationIds, selectAnnotationsByCategoryDict],
    (annotationIds, annotationsByCategory) =>
      (categoryId: string): number => {
        if (!Object.keys(annotationsByCategory).includes(categoryId)) return 0;

        return annotationsByCategory[categoryId].length;
      }
  );

export const selectAnnotationsByImage = createSelector(
  [selectAnnotationsByImageDict, selectAnnotationEntities],
  (idsByImage, entities): ((imageId: string) => AnnotationType[]) =>
    (imageId: string) => {
      const ids = idsByImage[imageId];
      if (!ids) return [];
      const annotations = ids.map((id) => entities[id]);
      return annotations;
    }
);

export const selectImageIdByAnnotation = createSelector(
  [selectAnnotationEntities],
  (entities): ((annotationId: string) => string) =>
    (annotationId: string) => {
      return entities[annotationId].imageId!;
    }
);
