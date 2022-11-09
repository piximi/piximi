import { Annotator } from "types";
export const boundingClientRectSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.boundingClientRect;
};
