import { ImageViewerStore, ZoomToolOptionsType } from "types";

export const selectZoomToolOptions = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): ZoomToolOptionsType => {
  return imageViewer.zoomOptions;
};
