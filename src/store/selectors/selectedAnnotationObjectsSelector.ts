import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationType } from "../../types/AnnotationType";
import { ShadowImageType } from "../../types/ImageType";
import { Shape } from "types/Shape";
import { Category } from "types/Category";

export const selectedAnnotationObjectsSelector = ({
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

    return annotationCategory ? annotationCategory.color : "#920000";
  };

  return imageViewer.selectedAnnotations.map((annotation: AnnotationType) => {
    return {
      annotation: annotation,
      imageShape: activeImage.shape,
      fillColor: getFillColor(annotation),
    };
  });
};
