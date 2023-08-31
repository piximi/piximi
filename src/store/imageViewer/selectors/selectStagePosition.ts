import { ImageViewerStore } from "types";
export const selectStagePosition = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): { x: number; y: number } => {
  return imageViewer.stagePosition;
};
