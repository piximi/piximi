import { Annotator, ShadowImageType } from "types";

export const activeImageSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): ShadowImageType | undefined => {
  if (!annotator.activeImageId) return undefined;
  return annotator.images.find((image) => image.id === annotator.activeImageId);
};
