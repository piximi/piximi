import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationType } from "../../types/AnnotationType";
import { ImageViewerImage } from "../../types/ImageViewerImage";

export const unselectedAnnotationsSelector = (
  imageViewer: ImageViewer
): Array<AnnotationType> => {
  if (!imageViewer.images.length) return [];

  const image = imageViewer.images.find((image: ImageViewerImage) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return [];

  const ids = imageViewer.selectedAnnotations.map(
    (annotation: AnnotationType) => {
      return annotation.id;
    }
  );

  return image.annotations.filter((annotation: AnnotationType) => {
    return !ids.includes(annotation.id);
  });
};
