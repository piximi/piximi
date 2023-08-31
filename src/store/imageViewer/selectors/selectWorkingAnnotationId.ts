import { ImageViewerStore } from "types";
export const selectWorkingAnnotationId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): string | undefined => {
  return imageViewer.workingAnnotationId;
};
