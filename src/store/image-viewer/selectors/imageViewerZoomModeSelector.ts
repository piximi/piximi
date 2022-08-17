import { ImageViewerState, ImageViewerZoomMode } from "types";

export const imageViewerZoomModeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ImageViewerZoomMode => {
  return imageViewer.zoomMode;
};
