import { ImageViewer } from "../../types/ImageViewer";
export const vibranceSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.vibrance;
};
