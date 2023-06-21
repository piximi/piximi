import { createSelector } from "@reduxjs/toolkit";
import { Category, OldImageType } from "types";
import { selectAllImages } from "./image";
import { selectAllImageCategories } from "./image-category/imageCategorySelectors";
import {
  selectAllAnnotations,
  selectAnnotationsByImageDict,
} from "./annotation";
import { selectAllAnnotationCategories } from "./annotation-category";

export const dataProjectSelector = createSelector(
  [
    selectAllImages,
    selectAllImageCategories,
    selectAllAnnotations,
    selectAllAnnotationCategories,
    selectAnnotationsByImageDict,
  ],
  (
    allImages,
    allImageCategories,
    allAnnotations,
    allAnnotationCategories,
    annotationsByImage
  ): {
    images: Array<OldImageType>;
    categories: Array<Category>;
    annotationCategories: Array<Category>;
  } => {
    const images: Array<OldImageType> = allImages.map((image) => {
      const annotationIds = annotationsByImage[image.id];
      const annotations = allAnnotations.filter((annotation) =>
        annotationIds.includes(annotation.id)
      );
      return {
        ...image,
        annotations,
      } as OldImageType;
    });

    return {
      images,
      categories: allImageCategories,
      annotationCategories: allAnnotationCategories,
    };
  }
);
