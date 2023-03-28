import { ImageViewer } from "types";
export const hueSelector = ({ imageViewer }: { imageViewer: ImageViewer }) => {
  return imageViewer.hue;
};
