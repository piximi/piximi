import { ImageViewer, ShadowImageType } from "types";
import { Colors, ColorsRaw } from "types/tensorflow";
import { generateDefaultChannels } from "image/utils/imageHelper";

export const activeImageColorsSelector = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): ColorsRaw => {
  const activeImage = imageViewer.images.find((image: ShadowImageType) => {
    return imageViewer.activeImageId === image.id;
  });

  let colors: Colors;

  if (!activeImage) {
    colors = generateDefaultChannels(3);
  } else {
    colors = activeImage.colors;
  }

  return {
    // TODO: image_data - is sync appropriate?
    // if so we may need to dispose??
    color: colors.color.arraySync() as [number, number, number][],
    range: colors.range,
    visible: colors.visible,
  };
};
