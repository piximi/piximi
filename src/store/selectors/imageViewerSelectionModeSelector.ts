import { ImageViewerState } from "../../types/ImageViewerState";

export const imageViewerSelectionModeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.selectionMode;
};
