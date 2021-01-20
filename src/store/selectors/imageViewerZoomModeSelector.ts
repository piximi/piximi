import { ImageViewerState } from "../../types/ImageViewerState";
import { ImageViewerZoomMode } from "../../types/ImageViewerZoomMode";

export const imageViewerZoomModeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ImageViewerZoomMode => {
  return imageViewer.zoomMode;
};
