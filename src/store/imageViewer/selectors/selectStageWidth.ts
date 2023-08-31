import { ImageViewerStore } from "types";
export const selectStageWidth = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): number => {
  return imageViewer.stageWidth;
};
