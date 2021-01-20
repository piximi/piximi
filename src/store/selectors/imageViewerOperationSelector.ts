import { ImageViewerState } from "../../types/ImageViewerState";
import { ImageViewerOperation } from "../../types/ImageViewerOperation";

export const imageViewerOperationSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): ImageViewerOperation => {
  return imageViewer.operation;
};
