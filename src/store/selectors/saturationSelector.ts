import { ImageViewer } from "../../types/ImageViewer";
export const saturationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.saturation;
};
