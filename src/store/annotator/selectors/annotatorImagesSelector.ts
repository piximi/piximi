import { Annotator, ShadowImageType } from "types";

export const annotatorImagesSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): Array<ShadowImageType> => {
  return annotator.images;
};
