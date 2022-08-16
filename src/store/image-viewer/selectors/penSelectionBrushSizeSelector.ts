import { ImageViewer } from "types";
export const penSelectionBrushSizeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.penSelectionBrushSize;
};
