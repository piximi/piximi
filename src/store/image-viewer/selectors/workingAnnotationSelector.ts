import { decodedAnnotationType, ImageViewer } from "types";

export const workingAnnotationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): decodedAnnotationType | undefined => {
  return imageViewer.workingAnnotation;
};
