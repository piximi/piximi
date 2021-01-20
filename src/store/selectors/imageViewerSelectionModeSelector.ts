import { ImageViewerState } from "../../types/ImageViewerState";
import { ImageViewerSelectionMode } from "../../types/ImageViewerSelectionMode";

export const imageViewerSelectionModeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ImageViewerSelectionMode => {
  return imageViewer.selectionMode;
};
