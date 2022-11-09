import { Annotator } from "types";

export const activeImageRenderedSrcsSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): Array<string> => {
  return annotator.activeImageRenderedSrcs;
};
