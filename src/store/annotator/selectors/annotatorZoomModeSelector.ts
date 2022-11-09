import { AnnotatorState, AnnotatorZoomMode } from "types";

export const annotatorZoomModeSelector = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): AnnotatorZoomMode => {
  return annotator.zoomMode;
};
