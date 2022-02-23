import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationType } from "../../types/AnnotationType";
import { ImageType } from "../../types/ImageType";

export const unselectedAnnotationsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<AnnotationType> => {
  if (!imageViewer.images.length) return [];

  const image = imageViewer.images.find((image: ImageType) => {
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
