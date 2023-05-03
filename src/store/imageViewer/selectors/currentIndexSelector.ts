import { ImageViewerStore } from "types";
export const currentIndexSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.currentIndex;
};
