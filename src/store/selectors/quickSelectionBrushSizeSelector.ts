import { ImageViewer } from "../../types/ImageViewer";
export const quickSelectionBrushSizeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.quickSelectionBrushSize;
};
