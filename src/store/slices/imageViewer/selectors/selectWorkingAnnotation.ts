import { ImageViewer } from "types";

export const selectWorkingAnnotation = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.workingAnnotation;
};
