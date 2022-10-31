import { decodedAnnotationType, ImageViewer } from "types";

export const stagedAnnotationsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<decodedAnnotationType> => {
  return imageViewer.stagedAnnotations;
};
