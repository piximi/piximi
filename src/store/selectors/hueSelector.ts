import { ImageViewer } from "../../types/ImageViewer";
export const hueSelector = ({ imageViewer }: { imageViewer: ImageViewer }) => {
  return imageViewer.hue;
};
