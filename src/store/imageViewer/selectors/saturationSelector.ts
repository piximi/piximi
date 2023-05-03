import { ImageViewerStore } from "types";
export const saturationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.saturation;
};
