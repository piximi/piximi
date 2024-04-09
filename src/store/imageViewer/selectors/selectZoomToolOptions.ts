import { ImageViewerState } from "store/types";
import { ZoomToolOptionsType } from "utils/annotator/types";

export const selectZoomToolOptions = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ZoomToolOptionsType => {
  return imageViewer.zoomOptions;
};
