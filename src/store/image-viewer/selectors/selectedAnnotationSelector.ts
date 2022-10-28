import { decodedAnnotationType, ImageViewer } from "types";

export const selectedAnnotationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): decodedAnnotationType | undefined => {
  return imageViewer.selectedAnnotation;
};
