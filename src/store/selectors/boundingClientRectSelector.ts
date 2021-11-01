import { ImageViewer } from "../../types/ImageViewer";
export const boundingClientRectSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.boundingClientRect;
};
