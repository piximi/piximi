import { createSelector } from "@reduxjs/toolkit";
import { AnnotationType, Category, ImageType } from "types";
import { selectAllImages } from "./image";
import { selectAllImageCategories } from "./image-category/imageCategorySelectors";
import { selectAllAnnotations } from "./annotation";
import { selectAllAnnotationCategories } from "./annotation-category";

export const selectDataProject = createSelector(
  [
    selectAllImages,
    selectAllImageCategories,
    selectAllAnnotations,
    selectAllAnnotationCategories,
  ],
  (
    allImages,
    allImageCategories,
    allAnnotations,
    allAnnotationCategories
  ): {
    images: Array<ImageType>;
    annotations: Array<AnnotationType>;
    categories: Array<Category>;
    annotationCategories: Array<Category>;
  } => {
    return {
      images: allImages,
      annotations: allAnnotations,
      categories: allImageCategories,
      annotationCategories: allAnnotationCategories,
    };
  }
);
