import { ImageViewer } from "../../types/ImageViewer";
export const thresholdAnnotationValueSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.thresholdAnnotationValue;
};
