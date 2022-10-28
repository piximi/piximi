import { decodedAnnotationType, ImageViewer } from "types";

export const selectedAnnotationsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<decodedAnnotationType> => {
  return imageViewer.selectedAnnotations;
};
