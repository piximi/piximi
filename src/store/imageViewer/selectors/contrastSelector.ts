import { ImageViewerStore } from "types";
export const contrastSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): number => {
  return imageViewer.contrast;
};
