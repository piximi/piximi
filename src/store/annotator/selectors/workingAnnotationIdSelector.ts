import { Annotator } from "types";
export const workingAnnotationIdSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): string | undefined => {
  return annotator.workingAnnotationId;
};
