import { Annotator, ShadowImageType } from "types";

export const imageHeightSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  if (!annotator.images.length || !annotator.activeImageId) return;

  const image = annotator.images.find((image: ShadowImageType) => {
    return image.id === annotator.activeImageId;
  });

  if (!image) return;

  return image.shape.height;
};
