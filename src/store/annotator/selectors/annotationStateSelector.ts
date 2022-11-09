import { AnnotationStateType, Annotator } from "types";

export const annotationStateSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): AnnotationStateType => {
  return annotator.annotationState;
};
