import { Annotator } from "types";
export const saturationSelector = ({ annotator }: { annotator: Annotator }) => {
  return annotator.saturation;
};
