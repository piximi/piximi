import { ImageViewer } from "types";
export const contrastSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.contrast;
};
