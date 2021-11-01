import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationModeType } from "../../types/AnnotationModeType";

export const selectionModeSelector = (
  imageViewer: ImageViewer
): AnnotationModeType => {
  return imageViewer.selectionMode;
};
