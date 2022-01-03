import { ImageViewer } from "../../types/ImageViewer";
import { AnnotationStateType } from "../../types/AnnotationStateType";

export const annotationStateSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): AnnotationStateType => {
  return imageViewer.annotationState;
};
