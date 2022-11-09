import { Annotator } from "types";
export const stageScaleSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): number => {
  return annotator.stageScale;
};
