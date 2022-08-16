import { ImageViewer } from "types";
export const exposureSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  return imageViewer.exposure;
};
