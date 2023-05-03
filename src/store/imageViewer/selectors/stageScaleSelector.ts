import { ImageViewerStore } from "types";
export const stageScaleSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): number => {
  return imageViewer.stageScale;
};
