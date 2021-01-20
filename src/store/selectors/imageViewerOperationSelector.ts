import { ImageViewerState } from "../../types/ImageViewerState";

export const imageViewerOperationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.operation;
};
