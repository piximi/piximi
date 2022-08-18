import { AnnotationType, ImageViewer } from "types";

export const selectedAnnotationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): AnnotationType | undefined => {
  return imageViewer.selectedAnnotation;
};
