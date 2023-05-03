import { ImageViewerStore } from "types";
export const penSelectionBrushSizeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.penSelectionBrushSize;
};
