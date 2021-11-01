import { ImageViewer } from "../../types/ImageViewer";
import { ImageViewerImage } from "../../types/ImageViewerImage";

export const scaledImageHeightSelector = (imageViewer: ImageViewer) => {
  if (!imageViewer.images.length) return;

  const image = imageViewer.images.filter((image: ImageViewerImage) => {
    return image.id === imageViewer.activeImageId;
  })[0];

  if (!image) return;

  return image.shape.height * imageViewer.stageScale;
};
