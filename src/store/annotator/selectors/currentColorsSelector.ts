import { Color, Annotator } from "types";

export const currentColorsSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): Array<Color> | undefined => {
  return annotator.currentColors;
};
