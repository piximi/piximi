import { ImageViewer } from "../../types/ImageViewer";
export const quickSelectionRegionSizeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.quickSelectionRegionSize;
};
