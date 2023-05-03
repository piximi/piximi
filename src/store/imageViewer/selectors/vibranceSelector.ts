import { ImageViewerStore } from "types";

export const vibranceSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.vibrance;
};
