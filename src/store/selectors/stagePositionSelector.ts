import { ImageViewer } from "../../types/ImageViewer";
export const stagePositionSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): { x: number; y: number } => {
  return imageViewer.stagePosition;
};
