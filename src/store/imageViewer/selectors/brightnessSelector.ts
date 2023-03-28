import { ImageViewer } from "types";
export const brightnessSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.brightness;
};
