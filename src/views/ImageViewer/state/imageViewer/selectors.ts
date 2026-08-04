import type {
  ZoomToolOptionsType,
  ImageViewerState,
} from "views/ImageViewer/utils/types";

export const selectZoomToolOptions = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ZoomToolOptionsType => {
  return imageViewer.zoomOptions;
};
