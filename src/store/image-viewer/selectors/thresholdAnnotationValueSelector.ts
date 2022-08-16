import { ImageViewer } from "types";
export const thresholdAnnotationValueSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.thresholdAnnotationValue;
};
