import { ImageViewerState } from "../../types/ImageViewerState";

export const imageViewerImageSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.image;
};
