import { ImageViewer } from "../../types/ImageViewer";
import { Image } from "../../types/Image";

export const activeImagePlaneSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  const activeImage = imageViewer.images.find((image: Image) => {
    return imageViewer.activeImageId === image.id;
  });

  if (!activeImage) return 0;

  return activeImage.activeSlice;
};
