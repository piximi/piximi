import { Annotator, ShadowImageType } from "types";

export const imageInstancesSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  if (!annotator.images.length) return [];

  const activeImage = annotator.images.find((image: ShadowImageType) => {
    return image.id === annotator.activeImageId;
  });
  if (activeImage) {
    return activeImage.annotations;
  } else {
    return [];
  }
};
