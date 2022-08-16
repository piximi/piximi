import { ImageViewer } from "types";
export const quickSelectionRegionSizeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.quickSelectionRegionSize;
};
