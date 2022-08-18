import { AnnotationStateType, ImageViewer } from "types";

export const annotationStateSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): AnnotationStateType => {
  return imageViewer.annotationState;
};
