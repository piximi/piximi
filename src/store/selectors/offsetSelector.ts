import { ImageViewer } from "../../types/ImageViewer";
export const offsetSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.offset;
};
