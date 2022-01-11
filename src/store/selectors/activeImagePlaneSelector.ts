import { ImageViewer } from "../../types/ImageViewer";

export const activeImagePlaneSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.activeImagePlane;
};
