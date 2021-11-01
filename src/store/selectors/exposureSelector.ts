import { ImageViewer } from "../../types/ImageViewer";
export const exposureSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.exposure;
};
