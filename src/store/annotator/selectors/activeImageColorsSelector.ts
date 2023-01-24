import { Annotator, ShadowImageType } from "types";
import { Colors, ColorsRaw } from "types/tensorflow";
import { generateBlankColors } from "image/utils/imageHelper";

export const activeImageColorsRawSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): ColorsRaw => {
  const activeImage = annotator.images.find((image: ShadowImageType) => {
    return annotator.activeImageId === image.id;
  });

  let colors: Colors;

  if (!activeImage) {
    colors = generateBlankColors(3);
  } else {
    colors = activeImage.colors;
  }

  return {
    // is sync appropriate? if so we may need to dispose??
    color: colors.color.arraySync() as [number, number, number][],
    range: colors.range,
    visible: colors.visible,
  };
};

export const activeImageColorsSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): Colors => {
  const activeImage = annotator.images.find((image: ShadowImageType) => {
    return annotator.activeImageId === image.id;
  });

  if (!activeImage) {
    return generateBlankColors(3);
  } else {
    return activeImage.colors;
  }
};
