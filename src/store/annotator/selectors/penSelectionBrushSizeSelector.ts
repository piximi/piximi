import { Annotator } from "types";
export const penSelectionBrushSizeSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.penSelectionBrushSize;
};
