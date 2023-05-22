import { ImageViewerStore } from "types";

export const selectWorkingAnnotation = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.workingAnnotation;
};
