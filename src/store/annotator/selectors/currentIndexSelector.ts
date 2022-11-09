import { Annotator } from "types";
export const currentIndexSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.currentIndex;
};
