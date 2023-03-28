import { AnnotatorOperation, AnnotatorState } from "types";

export const annotatorOperationSelector = ({
  imageViewer,
}: {
  imageViewer: AnnotatorState;
}): AnnotatorOperation => {
  return imageViewer.operation;
};
