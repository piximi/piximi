import { ImageViewer } from "../../types/ImageViewer";
export const brightnessSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.brightness;
};
