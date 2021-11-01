import { ImageViewer } from "../../types/ImageViewer";
export const invertModeSelector = (imageViewer: ImageViewer): boolean => {
  return imageViewer.invertMode;
};
