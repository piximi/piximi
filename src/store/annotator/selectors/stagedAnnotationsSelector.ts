import { DecodedAnnotationType, Annotator } from "types";

export const stagedAnnotationsSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): Array<DecodedAnnotationType> => {
  return annotator.stagedAnnotations;
};
