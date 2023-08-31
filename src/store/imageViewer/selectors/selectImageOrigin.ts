import { ImageViewerStore } from "types";
export const selectImageOrigin = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.imageOrigin;
};
