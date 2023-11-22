import { ImageViewer } from "types";

export const selectImageStackImageIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.imageStack;
};
