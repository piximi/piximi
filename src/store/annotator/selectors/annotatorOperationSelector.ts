import { AnnotatorOperation, AnnotatorState } from "types";

export const annotatorOperationSelector = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): AnnotatorOperation => {
  return annotator.operation;
};
