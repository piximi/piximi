import { ImageViewerStore } from "types";
export const stagePositionSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): { x: number; y: number } => {
  return imageViewer.stagePosition;
};
