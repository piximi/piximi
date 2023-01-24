import { Annotator, ShadowImageType } from "types";

export const activeImagePlaneSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): number => {
  const activeImage = annotator.images.find((image: ShadowImageType) => {
    return annotator.activeImageId === image.id;
  });

  if (!activeImage) return 0;

  return activeImage.activePlane;
};
