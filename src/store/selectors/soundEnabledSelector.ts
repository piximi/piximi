import { ImageViewer } from "../../types/ImageViewer";
export const soundEnabledSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.soundEnabled;
};
