import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationType } from "../../types/AnnotationType";
import { ShadowImageType } from "../../types/ImageType";
import { Shape } from "types/Shape";
import { Category, UNKNOWN_ANNOTATION_CATEGORY } from "types/Category";

export const unselectedAnnotationObjectsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<{
  annotation: AnnotationType;
  imageShape: Shape;
  fillColor: string;
}> => {
  if (!imageViewer.images.length) return [];

  const activeImage = imageViewer.images.find((image: ShadowImageType) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!activeImage) return [];

  const getFillColor = (annotation: AnnotationType) => {
    const annotationCategory = imageViewer.categories.find(
      (category: Category) => category.id === annotation.categoryId
    );

    return annotationCategory
      ? annotationCategory.color
      : UNKNOWN_ANNOTATION_CATEGORY.color;
  };

  const visibleCategories = imageViewer.categories
    .filter((category) => category.visible)
    .map((category) => {
      return category.id;
    });

  const selectedAnnotationIDs = imageViewer.selectedAnnotations.map(
    (annotation: AnnotationType) => {
      return annotation.id;
    }
  );

  const visibleUnselectedAnnotations = activeImage.annotations
    .filter((annotation: AnnotationType) => {
      return !selectedAnnotationIDs.includes(annotation.id);
    })
    .filter((annotation: AnnotationType) => {
      return (
        visibleCategories.includes(annotation.categoryId) &&
        annotation.plane === activeImage?.activePlane
      );
    });

  return visibleUnselectedAnnotations.map(
    (visibleUnselectedAnnotation: AnnotationType) => {
      return {
        annotation: visibleUnselectedAnnotation,
        imageShape: activeImage.shape,
        fillColor: getFillColor(visibleUnselectedAnnotation),
      };
    }
  );
};
