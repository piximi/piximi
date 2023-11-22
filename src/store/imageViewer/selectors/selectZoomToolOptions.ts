import { ImageViewer, ZoomToolOptionsType } from "types";

export const selectZoomToolOptions = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): ZoomToolOptionsType => {
  return imageViewer.zoomOptions;
};
