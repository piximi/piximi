import { ImageViewerState } from "../../types/ImageViewerState";

export const imageViewerZoomModeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.zoomMode;
};
