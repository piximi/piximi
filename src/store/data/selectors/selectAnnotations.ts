import { createSelector } from "@reduxjs/toolkit";
import {
  selectStagedAnnotationIds,
  workingAnnotationIdSelector,
} from "store/imageViewer";
import { DecodedAnnotationType } from "types";
import { selectAnnotationEntities } from "./selectAnotationEntities";
import { decodeAnnotation } from "utils/annotator";
import {
  selectAnnotationsByImageEntity,
  selectStagedAnnotationEntities,
} from "./selectDataEntities";

export const selectAllAnnotations = createSelector(
  [selectAnnotationEntities],
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

export const selectTotalAnnotationCountByImage = createSelector(
  [
    selectAnnotationsByImageEntity,
    selectStagedAnnotationEntities,
    (state, imageId) => imageId,
  ],
  (annotationsByImage, stagedAnnotationsEntities, imageId) => {
    let count = 0;
    const stagedImageAnnotations: typeof stagedAnnotationsEntities = {};
    for (const stagedAnnotationId in stagedAnnotationsEntities) {
      if (stagedAnnotationsEntities[stagedAnnotationId]!.imageId === imageId) {
        stagedImageAnnotations[stagedAnnotationId] =
          stagedAnnotationsEntities[stagedAnnotationId];
      }
    }
    for (const annotationId of annotationsByImage[imageId]) {
      if (stagedImageAnnotations[annotationId]) {
        if (!stagedImageAnnotations[annotationId]?.deleted) {
          count++;
        }
        delete stagedImageAnnotations[annotationId];
        continue;
      }
      count++;
    }
    count += Object.keys(stagedImageAnnotations).length;

    return count;
  }
);
