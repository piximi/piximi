import { ImageViewerState } from "types";

export const imageViewerImageSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.image;
};
