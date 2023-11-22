import { ImageViewer } from "types";
export const selectWorkingAnnotationId = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string | undefined => {
  return imageViewer.workingAnnotationId;
};
