import { ImageViewerStore } from "types";
export const imageOriginSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.imageOrigin;
};
