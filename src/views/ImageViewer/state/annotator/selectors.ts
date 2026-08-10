import type {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "views/ImageViewer/utils/enums";
import type { AnnotatorState } from "../../utils/types";

export const selectAnnotationState = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): AnnotationState => {
  return annotator.annotationState;
};

export const selectAnnotationMode = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): AnnotationMode => {
  return annotator.annotationMode;
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
export const selectPendingTargetIds = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): Array<string> => {
  return annotator.pendingTargetIds;
};
export const selectWorkingAnnotationEntity = ({
  annotator,
}: {
  annotator: AnnotatorState;
}) => {
  return annotator.workingAnnotation;
};
