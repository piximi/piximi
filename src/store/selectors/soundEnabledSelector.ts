import { ImageViewer } from "../../types/ImageViewer";
export const soundEnabledSelector = (imageViewer: ImageViewer) => {
  return imageViewer.soundEnabled;
};
