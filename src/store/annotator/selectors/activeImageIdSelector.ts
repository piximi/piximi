import { Annotator } from "types";

export const activeImageIdSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): string | undefined => {
  return annotator.activeImageId;
};
