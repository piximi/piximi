import { Annotator } from "types";
export const contrastSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): number => {
  return annotator.contrast;
};
