import { Annotator } from "types";

export const vibranceSelector = ({ annotator }: { annotator: Annotator }) => {
  return annotator.vibrance;
};
