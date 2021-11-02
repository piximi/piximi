import { ImageViewer } from "../../types/ImageViewer";
import { ImageViewerImage } from "../../types/ImageViewerImage";

export const imageOriginalSrcSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}) => {
  if (!imageViewer.images.length) return;

  const image = imageViewer.images.find((image: ImageViewerImage) => {
    return image.id === imageViewer.activeImageId;
  });

  if (!image) return;

  return image.src;
};
