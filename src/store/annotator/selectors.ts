import { AnnotatorState } from "store/types";
import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "utils/annotator/enums";

export const selectAnnotationState = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): AnnotationState => {
  return annotator.annotationState;
};

export const selectAnnotationSelectionMode = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): AnnotationMode => {
  return annotator.selectionMode;
};
export const selectPenSelectionBrushSize = ({
  annotator,
}: {
  annotator: AnnotatorState;
}) => {
  return annotator.penSelectionBrushSize;
};

export const selectQuickSelectionRegionSize = ({
  annotator,
}: {
  annotator: AnnotatorState;
}) => {
  return annotator.quickSelectionRegionSize;
};

export const selectThresholdAnnotationValue = ({
  annotator,
}: {
  annotator: AnnotatorState;
}) => {
  return annotator.thresholdAnnotationValue;
};

export const selectToolType = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): ToolType => {
  return annotator.toolType;
};
