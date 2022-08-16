import { ImageViewerOperation, ImageViewerState } from "types";

export const imageViewerOperationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ImageViewerOperation => {
  return imageViewer.operation;
};
