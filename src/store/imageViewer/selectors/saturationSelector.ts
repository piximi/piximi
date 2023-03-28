import { ImageViewer } from "types";
export const saturationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.saturation;
};
