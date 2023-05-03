import { ImageViewerStore } from "types";
export const exposureSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.exposure;
};
