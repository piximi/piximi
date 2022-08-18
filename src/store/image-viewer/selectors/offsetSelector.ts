import { ImageViewer } from "types";
export const offsetSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.offset;
};
