import { ImageViewer } from "types";

export const selectImageIsloading = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.imageIsLoading;
};
