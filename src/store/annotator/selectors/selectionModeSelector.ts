import { AnnotationModeType, Annotator } from "types";

export const selectionModeSelector = ({
  annotator,
}: {
  annotator: Annotator;
}): AnnotationModeType => {
  return annotator.selectionMode;
};
