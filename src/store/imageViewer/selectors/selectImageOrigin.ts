import { ImageViewerState } from "store/types";
export const selectImageOrigin = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.imageOrigin;
};
