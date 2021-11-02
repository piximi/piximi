import { ImageViewer } from "../../types/ImageViewer";
export const currentIndexSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.currentIndex;
};
