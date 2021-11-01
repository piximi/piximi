import { ImageViewer } from "../../types/ImageViewer";
import { ImageViewerImage } from "../../types/ImageViewerImage";

export const imageWidthSelector = (imageViewer: ImageViewer) => {
  if (!imageViewer.images.length || !imageViewer.activeImageId) return;

  const image = imageViewer.images.filter((image: ImageViewerImage) => {
    return image.id === imageViewer.activeImageId;
  })[0];

  return image.shape.width;
};
