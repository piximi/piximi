import { ImageViewerSelectionMode, ImageViewerState } from "types";

export const imageViewerSelectionModeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ImageViewerSelectionMode => {
  return imageViewer.selectionMode;
};
