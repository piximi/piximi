import { ImageViewerStore } from "types";

export const selectImageStackImageIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.imageStack;
};
