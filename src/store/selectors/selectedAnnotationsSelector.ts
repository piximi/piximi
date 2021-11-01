import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationType } from "../../types/AnnotationType";

export const selectedAnnotationsSelector = (
  imageViewer: ImageViewer
): Array<AnnotationType> => {
  return imageViewer.selectedAnnotations;
};
