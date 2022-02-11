import { ImageViewer } from "../../types/ImageViewer";
import { ImageType } from "../../types/ImageType";

export const activeImagePlaneSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  const activeImage = imageViewer.images.find((image: ImageType) => {
    return imageViewer.activeImageId === image.id;
  });

  if (!activeImage) return 0;

  return activeImage.activePlane;
};
