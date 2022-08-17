import { ImageViewer } from "types";

export const vibranceSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.vibrance;
};
