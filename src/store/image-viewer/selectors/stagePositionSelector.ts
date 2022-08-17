import { ImageViewer } from "types";
export const stagePositionSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): { x: number; y: number } => {
  return imageViewer.stagePosition;
};
