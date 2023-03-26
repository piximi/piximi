import { createSelector } from "@reduxjs/toolkit";
import {
  selectStagedAnnotationIds,
  workingAnnotationIdSelector,
} from "store/annotator";
import { DataStoreSlice, DecodedAnnotationType } from "types";
import { selectAnnotationEntities } from "./selectAnotationEntities";
import { decodeAnnotation } from "utils/annotator";

export const selectAllAnnotations = createSelector(
  [
    ({ data }: { data: DataStoreSlice }) => {
      return data.annotations.entities;
    },
  ],
  (annotationEntities) => {
    return Object.values(annotationEntities);
  }
);

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
