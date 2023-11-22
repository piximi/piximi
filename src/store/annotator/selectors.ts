import {
  AnnotationModeType,
  AnnotationStateType,
  Annotator,
  ToolType,
} from "types";

export const selectAnnotationState = ({
  annotator,
}: {
  annotator: Annotator;
}): AnnotationStateType => {
  return annotator.annotationState;
};

export const selectAnnotationSelectionMode = ({
  annotator,
}: {
  annotator: Annotator;
}): AnnotationModeType => {
  return annotator.selectionMode;
};
export const selectPenSelectionBrushSize = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.penSelectionBrushSize;
};

export const selectQuickSelectionRegionSize = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.quickSelectionRegionSize;
};

export const selectThresholdAnnotationValue = ({
  annotator,
}: {
  annotator: Annotator;
}) => {
  return annotator.thresholdAnnotationValue;
};

export const selectToolType = ({
  annotator,
}: {
  annotator: Annotator;
}): ToolType => {
  return annotator.toolType;
};
