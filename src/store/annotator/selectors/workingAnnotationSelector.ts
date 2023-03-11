import { DecodedAnnotationType, Annotator } from "types";

export const workingAnnotationSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): DecodedAnnotationType | undefined => {
  return annotator.workingAnnotation;
};
