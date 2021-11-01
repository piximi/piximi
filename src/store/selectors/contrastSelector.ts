import { ImageViewer } from "../../types/ImageViewer";
export const contrastSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.contrast;
};
