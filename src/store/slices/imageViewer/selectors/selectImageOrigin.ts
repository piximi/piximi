import { ImageViewer } from "types";
export const selectImageOrigin = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.imageOrigin;
};
