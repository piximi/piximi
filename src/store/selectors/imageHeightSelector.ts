import { ImageViewer } from "../../types/ImageViewer";
import { ImageType } from "../../types/ImageType";

export const imageHeightSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length || !imageViewer.activeImageId) return;

  const image = imageViewer.images.find((image: ImageType) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return;

  return image.shape.height;
};
