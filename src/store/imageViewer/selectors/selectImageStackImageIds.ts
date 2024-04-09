import { ImageViewerState } from "store/types";

export const selectImageStackImageIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.imageStack;
};
