import { ImageViewer } from "types";
export const selectStageWidth = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.stageWidth;
};
