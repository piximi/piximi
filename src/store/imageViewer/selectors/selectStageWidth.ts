import { ImageViewerState } from "store/types";
export const selectStageWidth = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): number => {
  return imageViewer.stageWidth;
};
