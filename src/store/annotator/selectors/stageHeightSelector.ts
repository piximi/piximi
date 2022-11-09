import { Annotator } from "types";
export const stageHeightSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): number => {
  return annotator.stageHeight;
};
