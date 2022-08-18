import { AnnotationType, ImageViewer } from "types";

export const selectedAnnotationsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<AnnotationType> => {
  return imageViewer.selectedAnnotations;
};
