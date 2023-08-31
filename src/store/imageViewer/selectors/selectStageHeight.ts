import { ImageViewerStore } from "types";
export const selectStageHeight = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): number => {
  return imageViewer.stageHeight;
};
