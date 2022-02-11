import { ImageViewer } from "../../types/ImageViewer";
import { ImageType } from "../../types/ImageType";

export const imageWidthSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length || !imageViewer.activeImageId) return;

  const image = imageViewer.images.filter((image: ImageType) => {
    return image.id === imageViewer.activeImageId;
  })[0];

  return image.shape.width;
};
