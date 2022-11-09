import { Color, Annotator, ShadowImageType } from "types";
import { generateDefaultChannels } from "utils/common/imageHelper";

export const activeImageColorsSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): Array<Color> => {
  const activeImage = annotator.images.find((image: ShadowImageType) => {
    return annotator.activeImageId === image.id;
  });

  if (!activeImage) return generateDefaultChannels(3);

  return activeImage.colors;
};
