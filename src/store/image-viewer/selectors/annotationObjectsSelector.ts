import { createSelector } from "@reduxjs/toolkit";

import {
  stagedAnnotationsSelector,
  workingAnnotationSelector,
  activeImageSelector,
} from "store/image-viewer";
import { annotationCategoriesSelector } from "store/project";

import {
  decodedAnnotationType,
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
  Shape,
} from "types";

type AnnotationObject = {
  annotation: decodedAnnotationType;
  imageShape: Shape;
  fillColor: string;
};

export const annotationObjectsSelector = createSelector(
  [
    activeImageSelector,
    annotationCategoriesSelector,
    stagedAnnotationsSelector,
    workingAnnotationSelector,
  ],
  (activeImage, categories, stagedAnnotations, workingAnnotation) => {
    if (!activeImage) return [];

    const getFillColor = (annotation: decodedAnnotationType) => {
      const annotationCategory = categories.find(
        (category: Category) => category.id === annotation.categoryId
      );

      return annotationCategory
        ? annotationCategory.color
        : UNKNOWN_ANNOTATION_CATEGORY.id;
    };

    if (workingAnnotation) {
      const reducedAnnotations: AnnotationObject[] = stagedAnnotations.reduce(
        (
          objectArray: AnnotationObject[],
          annotation: decodedAnnotationType
        ) => {
          if (workingAnnotation.id !== annotation.id) {
            objectArray.push({
              annotation: annotation,
              imageShape: activeImage.shape,
              fillColor: getFillColor(annotation),
            });
          }
          return objectArray;
        },
        []
      );
      return [
        ...reducedAnnotations,
        {
          annotation: workingAnnotation,
          imageShape: activeImage.shape,
          fillColor: getFillColor(workingAnnotation),
        },
      ];
    } else {
      return stagedAnnotations.map((annotation: decodedAnnotationType) => {
        return {
          annotation: annotation,
          imageShape: activeImage.shape,
          fillColor: getFillColor(annotation),
        };
      });
    }
  }
);
