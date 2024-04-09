import { ImageViewerState } from "store/types";
export const selectStageScale = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): number => {
  return imageViewer.zoomOptions.scale;
};
