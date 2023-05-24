import {
  AnnotationModeType,
  AnnotationStateType,
  AnnotatorStore,
  ToolType,
} from "types";

export const selectAnnotationState = ({
  annotator,
}: {
  annotator: AnnotatorStore;
}): AnnotationStateType => {
  return annotator.annotationState;
};

export const selectAnnotationSelectionMode = ({
  annotator,
}: {
  annotator: AnnotatorStore;
}): AnnotationModeType => {
  return annotator.selectionMode;
};
export const selectPenSelectionBrushSize = ({
  annotator,
}: {
  annotator: AnnotatorStore;
}) => {
  return annotator.penSelectionBrushSize;
};

export const selectQuickSelectionRegionSize = ({
  annotator,
}: {
  annotator: AnnotatorStore;
}) => {
  return annotator.quickSelectionRegionSize;
};

export const selectThresholdAnnotationValue = ({
  annotator,
}: {
  annotator: AnnotatorStore;
}) => {
  return annotator.thresholdAnnotationValue;
};

export const selectToolType = ({
  annotator,
}: {
  annotator: AnnotatorStore;
}): ToolType => {
  return annotator.toolType;
};
