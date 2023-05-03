import { ImageViewerStore } from "types";
export const stageWidthSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): number => {
  return imageViewer.stageWidth;
};
