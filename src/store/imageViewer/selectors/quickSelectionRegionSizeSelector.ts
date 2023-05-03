import { ImageViewerStore } from "types";
export const quickSelectionRegionSizeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.quickSelectionRegionSize;
};
