import { ImageViewerState } from "store/types";
export const selectStagePosition = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): { x: number; y: number } => {
  return imageViewer.stagePosition;
};
