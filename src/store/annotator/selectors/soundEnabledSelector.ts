import { Annotator } from "types";
export const soundEnabledSelector = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.soundEnabled;
};
