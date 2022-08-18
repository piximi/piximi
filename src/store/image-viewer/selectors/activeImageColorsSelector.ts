import { Color, ImageViewer, ShadowImageType } from "types";
import { generateDefaultChannels } from "image/imageHelper";

export const activeImageColorsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<Color> => {
  const activeImage = imageViewer.images.find((image: ShadowImageType) => {
    return imageViewer.activeImageId === image.id;
  });

  if (!activeImage) return generateDefaultChannels(3);

  return activeImage.colors;
};
