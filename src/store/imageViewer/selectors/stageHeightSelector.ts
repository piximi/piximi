import { ImageViewerStore } from "types";
export const stageHeightSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): number => {
  return imageViewer.stageHeight;
};
