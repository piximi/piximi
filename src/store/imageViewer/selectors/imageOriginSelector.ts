import { ImageViewer } from "types";
export const imageOriginSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.imageOrigin;
};
