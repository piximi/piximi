import { ImageViewerStore } from "types";

export const selectImageIsloading = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.imageIsLoading;
};
