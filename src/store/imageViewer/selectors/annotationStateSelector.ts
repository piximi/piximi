import { AnnotationStateType, ImageViewerStore } from "types";

export const annotationStateSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): AnnotationStateType => {
  return imageViewer.annotationState;
};
