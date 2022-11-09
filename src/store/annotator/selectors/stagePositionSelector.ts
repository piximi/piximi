import { Annotator } from "types";
export const stagePositionSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): { x: number; y: number } => {
  return annotator.stagePosition;
};
