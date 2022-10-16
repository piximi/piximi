import { ImageViewer, ShadowImageType } from "types";
import { Colors } from "types/tensorflow";
import { generateDefaultChannels } from "image/utils/imageHelper";

export const activeImageColorsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Colors => {
  const activeImage = imageViewer.images.find((image: ShadowImageType) => {
    return imageViewer.activeImageId === image.id;
  });

  if (!activeImage) return generateDefaultChannels(3);

  return activeImage.colors;
};
