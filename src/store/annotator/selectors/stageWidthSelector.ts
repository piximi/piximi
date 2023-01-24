import { Annotator } from "types";
export const stageWidthSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): number => {
  return annotator.stageWidth;
};
