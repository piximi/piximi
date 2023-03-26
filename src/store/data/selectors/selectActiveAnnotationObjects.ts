import { createSelector } from "@reduxjs/toolkit";

import { DataStoreSlice } from "types";
import { decodeAnnotation } from "utils/annotator";
import { selectActiveImage } from "./selectActiveImage";
import { activeImageIdSelector } from "store/annotator";

const selectAnnotationEntities = ({ data }: { data: DataStoreSlice }) => {
  return data.annotations.entities;
};
const selectAnnotationCategoryEntities = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.annotationCategories.entities;
};

const selectAnnotionsByImageEntity = ({ data }: { data: DataStoreSlice }) => {
  return data.annotationsByImage;
};

// NOTE: re-selects on activeImageId, annotationsByImage
const selectActiveAnnotationIds = createSelector(
  [activeImageIdSelector, selectAnnotionsByImageEntity],
  (activeImageId, annotationsByImage): Array<string> => {
    if (!activeImageId) return [];
    return annotationsByImage[activeImageId];
  }
);

// NOTE:  re-selects on activeImageId, image.entities
const selectActiveImageShape = createSelector(
  [selectActiveImage],
  (activeImage) => {
    if (!activeImage) return;
    return activeImage.shape;
  }
);

// Note: re-selects on activeImageId, image.entities, annotationsByImage, annotations.entities, annotationCategories.entities
export const selectActiveAnnotationObjects = createSelector(
  [
    selectActiveImageShape,
    selectActiveAnnotationIds,
    selectAnnotationEntities,
    selectAnnotationCategoryEntities,
  ],
  (
    activeImageShape,
    activeAnnotationIds,
    annotationEntities,
    categoryEntities
  ) => {
    if (!activeImageShape) return [];

    const annotationObjects = activeAnnotationIds.map((annotationId) => {
      const annotation = decodeAnnotation(annotationEntities[annotationId])!;
      const fillColor = categoryEntities[annotation.categoryId].color;
      return {
        annotation,
        fillColor,
        imageShape: activeImageShape,
      };
    });

    return annotationObjects;
  }
);
