import { AnnotationModeType, ImageViewer } from "types";

export const selectionModeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): AnnotationModeType => {
  return imageViewer.selectionMode;
};
