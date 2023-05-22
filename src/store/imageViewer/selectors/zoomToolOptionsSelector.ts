import { ImageViewerStore, ZoomToolOptionsType } from "types";

export const zoomToolOptionsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): ZoomToolOptionsType => {
  return imageViewer.zoomOptions;
};
