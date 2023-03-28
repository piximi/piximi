import { ImageViewer } from "types";
export const currentIndexSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.currentIndex;
};
