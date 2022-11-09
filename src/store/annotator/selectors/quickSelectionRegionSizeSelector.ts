import { Annotator } from "types";
export const quickSelectionRegionSizeSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.quickSelectionRegionSize;
};
