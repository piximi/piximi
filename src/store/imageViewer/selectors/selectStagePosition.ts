import { ImageViewer } from "types";
export const selectStagePosition = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): { x: number; y: number } => {
  return imageViewer.stagePosition;
};
