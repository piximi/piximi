import { ImageViewerStore } from "types";
export const brightnessSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.brightness;
};
