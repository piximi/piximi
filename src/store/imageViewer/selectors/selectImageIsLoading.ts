import { ImageViewerState } from "store/types";

export const selectImageIsloading = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}) => {
  return imageViewer.imageIsLoading;
};
