import { ImageViewer } from "types";
export const selectStageHeight = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.stageHeight;
};
