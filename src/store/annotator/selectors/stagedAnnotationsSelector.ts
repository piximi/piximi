import { decodedAnnotationType, Annotator } from "types";

export const stagedAnnotationsSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): Array<decodedAnnotationType> => {
  return annotator.stagedAnnotations;
};
