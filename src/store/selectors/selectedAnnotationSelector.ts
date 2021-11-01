import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationType } from "../../types/AnnotationType";

export const selectedAnnotationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): AnnotationType | undefined => {
  return imageViewer.selectedAnnotation;
};
