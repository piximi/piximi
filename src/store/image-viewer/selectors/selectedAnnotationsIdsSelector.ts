import { ImageViewer } from "types";

export const selectedAnnotationsIdsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<string> => {
  return imageViewer.selectedAnnotations;
};
