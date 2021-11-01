import { ImageViewer } from "../../types/ImageViewer";
export const penSelectionBrushSizeSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.penSelectionBrushSize;
};
