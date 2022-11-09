import { Annotator } from "types";
export const cursorSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): string => {
  return annotator.cursor;
};
