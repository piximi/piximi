import { ImageViewerStore } from "types";
export const hueSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.hue;
};
