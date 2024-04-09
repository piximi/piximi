import { ImageViewerState } from "store/types";

export const selectWorkingAnnotation = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.workingAnnotation;
};

export const selectWorkingAnnotationNew = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.workingAnnotationNew;
};
