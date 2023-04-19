import { createSelector } from "@reduxjs/toolkit";
import {
  selectStagedAnnotationIds,
  workingAnnotationIdSelector,
} from "store/imageViewer";
import { DataStoreSlice, DecodedAnnotationType } from "types";
import { decodeAnnotation } from "utils/annotator";

export const selectAnnotationEntities = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.annotations.entities;
};
export const selectStagedAnnotationEntities = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.stagedAnnotations.entities;
};

export const selectAllAnnotations = createSelector(
  [selectAnnotationEntities, selectStagedAnnotationEntities],
  (annotationEntities, stagedAnnotationEntities) => {
    return Object.values(annotationEntities);
  }
);

export const selectAnnotationsByImageEntity = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.annotationsByImage;
};

export const selectAnnotationsByCategoryEntity = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.annotationsByCategory;
};

export const selectWorkingAnnotation = createSelector(
  [workingAnnotationIdSelector, selectAnnotationEntities],
  (annotationId, annotationEntities): DecodedAnnotationType | undefined => {
    if (!annotationId) return;
    return decodeAnnotation(annotationEntities[annotationId]!)!;
  }
);
export const selectStagedAnnotations = createSelector(
  [selectStagedAnnotationIds, selectAnnotationEntities],
  (annotationIds, annotationEntities): Array<DecodedAnnotationType> => {
    if (!annotationIds.length) return [];
    return annotationIds.map(
      (annotationId) => decodeAnnotation(annotationEntities[annotationId]!)!
    );
  }
);

export const selectSelectedAnnotations = createSelector(
  [
    selectStagedAnnotationIds,
    workingAnnotationIdSelector,
    selectAnnotationEntities,
  ],
  (stagedIds, workingId, annotationEntities): Array<DecodedAnnotationType> => {
    if (!workingId)
      return stagedIds.map(
        (annotationId) => decodeAnnotation(annotationEntities[annotationId]!)!
      );
    return [...stagedIds, workingId].map(
      (annotationId) => decodeAnnotation(annotationEntities[annotationId]!)!
    );
  }
);

export const selectDeletedAnnotationIds = createSelector(
  [selectStagedAnnotationEntities],
  (stagedAnnotationEntities) => {
    return Object.keys(stagedAnnotationEntities).filter(
      (annotationId) => stagedAnnotationEntities[annotationId]?.deleted
    );
  }
);

export const selectTotalAnnotationCountByImage = createSelector(
  [
    selectAnnotationsByImageEntity,
    selectDeletedAnnotationIds,

    (state, imageId) => imageId,
  ],
  (annotationsByImage, deletedAnnotations, imageId) => {
    let count = 0;

    for (const id of annotationsByImage[imageId]) {
      if (!deletedAnnotations.includes(id)) {
        count++;
      }
    }

    return count;
  }
);

export const selectAnnotationIdsByImage = createSelector(
  [selectAnnotationsByImageEntity, (state, imageId: string) => imageId],
  (annotationsByImage, imageId) => {
    return annotationsByImage[imageId];
  }
);

// TODO: O(NxM)
export const selectAnnotationCountByCategory = () =>
  createSelector(
    [
      selectDeletedAnnotationIds,
      selectAnnotationsByCategoryEntity,
      (state, categoryId: string) => categoryId,
    ],
    (deletedAnnotations, annotationsByCategory, categoryId) => {
      let count = 0;
      for (const id of annotationsByCategory[categoryId]) {
        if (!deletedAnnotations.includes(id)) {
          count++;
        }
      }
      return count;
    }
  );
