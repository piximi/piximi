import { ImageViewer } from "types";
export const boundingClientRectSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.boundingClientRect;
};
