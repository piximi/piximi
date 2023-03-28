import { AnnotatorSelectionMode, AnnotatorState } from "types";

export const annotatorSelectionModeSelector = ({
  imageViewer,
}: {
  imageViewer: AnnotatorState;
}): AnnotatorSelectionMode => {
  return imageViewer.selectionMode;
};
