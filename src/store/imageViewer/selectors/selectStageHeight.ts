import { ImageViewerState } from "store/types";
export const selectStageHeight = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): number => {
  return imageViewer.stageHeight;
};
