import { AnnotatorSelectionMode, AnnotatorState } from "types";

export const annotatorSelectionModeSelector = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): AnnotatorSelectionMode => {
  return annotator.selectionMode;
};
