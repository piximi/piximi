import { Annotator, ShadowImageType } from "types";

export const imageShapeSelector = ({ annotator }: { annotator: Annotator }) => {
  if (!annotator.images.length) return;

  const image = annotator.images.find((image: ShadowImageType) => {
    return image.id === annotator.activeImageId;
  });

  if (!image) return;

  return image.shape;
};
