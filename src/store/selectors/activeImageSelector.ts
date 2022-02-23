import { ImageViewer } from "../../types/ImageViewer";
import { ImageType } from "../../types/ImageType";

export const activeImageSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): ImageType | undefined => {
  const activeImage = imageViewer.images.find((image: ImageType) => {
    return imageViewer.activeImageId === image.id;
  });

  return activeImage;
};
