import { Annotator } from "types";
export const workingAnnotationIdSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): string | undefined => {
  if (!annotator.workingAnnotation) return undefined;
  else return annotator.workingAnnotation.id;
};
