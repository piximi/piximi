import { ImageViewer } from "../../types/ImageViewer";
import { Image } from "../../types/Image";

export const activeImagePlaneSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  return imageViewer.activeImagePlane;
};
