import { ImageViewer } from "../../types/ImageViewer";
import { Image } from "../../types/Image";

export const imageHeightSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length || !imageViewer.activeImageId) return;

  const image = imageViewer.images.find((image: Image) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return;

  return image.shape.height;
};
