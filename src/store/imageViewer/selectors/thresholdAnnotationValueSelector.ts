import { ImageViewerStore } from "types";
export const thresholdAnnotationValueSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}) => {
  return imageViewer.thresholdAnnotationValue;
};
