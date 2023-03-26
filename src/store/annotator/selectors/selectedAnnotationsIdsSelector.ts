import { Annotator } from "types";

export const selectedAnnotationsIdsSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): Array<string> => {
  return annotator.selectedAnnotationIds;
};
