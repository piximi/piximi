import { ImageViewer } from "../../types/ImageViewer";
import { Image } from "../../types/Image";

export const activeImageSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Image | undefined => {
  const activeImage = imageViewer.images.find((image: Image) => {
    return imageViewer.activeImageId === image.id;
  });

  return activeImage;
};
