import { ImageViewerState } from "store/types";
export const selectWorkingAnnotationId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): string | undefined => {
  return imageViewer.workingAnnotationId;
};
