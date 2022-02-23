import { ImageViewer } from "../../types/ImageViewer";
import { ImageType } from "../../types/ImageType";
import { Color } from "../../types/Color";
import { generateDefaultChannels } from "../../image/imageHelper";

export const activeImageColorsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): Array<Color> => {
  const activeImage = imageViewer.images.find((image: ImageType) => {
    return imageViewer.activeImageId === image.id;
  });

  if (!activeImage) return generateDefaultChannels(3);

  return activeImage.colors;
};
