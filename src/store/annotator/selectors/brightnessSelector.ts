import { Annotator } from "types";
export const brightnessSelector = ({ annotator }: { annotator: Annotator }) => {
  return annotator.brightness;
};
