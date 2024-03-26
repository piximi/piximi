import { ImageViewer } from "types";

export const selectWorkingAnnotation = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.workingAnnotation;
};

export const selectWorkingAnnotationNew = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.workingAnnotationNew;
};
