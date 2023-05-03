import { AnnotationModeType, ImageViewerStore } from "types";

export const selectionModeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): AnnotationModeType => {
  return imageViewer.selectionMode;
};
