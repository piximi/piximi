import { ImageViewer } from "types";
export const workingAnnotationIdSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string | undefined => {
  return imageViewer.workingAnnotationId;
};
