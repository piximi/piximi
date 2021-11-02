import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationModeType } from "../../types/AnnotationModeType";

export const selectionModeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): AnnotationModeType => {
  return imageViewer.selectionMode;
};
