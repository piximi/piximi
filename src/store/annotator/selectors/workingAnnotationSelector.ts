import { decodedAnnotationType, Annotator } from "types";

export const workingAnnotationSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): decodedAnnotationType | undefined => {
  return annotator.workingAnnotation;
};
