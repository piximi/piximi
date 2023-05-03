import { ImageViewerStore } from "types";
export const workingAnnotationIdSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): string | undefined => {
  return imageViewer.workingAnnotationId;
};
