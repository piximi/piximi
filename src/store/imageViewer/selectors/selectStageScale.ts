import { ImageViewerStore } from "types";
export const selectStageScale = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): number => {
  return imageViewer.stageScale;
};
