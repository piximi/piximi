import { ImageViewerState } from "../../utils/types";

export const selectActiveImageDetails = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  if (imageViewer.activeImageId === undefined) {
    return undefined;
  }
  return imageViewer.imageStack[imageViewer.activeImageId];
};
