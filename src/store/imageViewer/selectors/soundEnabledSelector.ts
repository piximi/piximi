import { ImageViewer } from "types";
export const soundEnabledSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.soundEnabled;
};
