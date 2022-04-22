import { ImageViewer } from "../../types/ImageViewer";
import { ShadowImageType } from "../../types/ImageType";

export const activeImagePlaneSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): number => {
  const activeImage = imageViewer.images.find((image: ShadowImageType) => {
    return imageViewer.activeImageId === image.id;
  });

  if (!activeImage) return 0;

  return activeImage.activePlane;
};
