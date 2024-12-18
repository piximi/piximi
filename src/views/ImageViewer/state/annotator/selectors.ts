import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "utils/annotator/enums";

import { AnnotatorState } from "store/types";

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
export const selectWorkingAnnotationId = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): string | undefined => {
  return annotator.workingAnnotationId;
};
export const selectWorkingAnnotation = ({
  annotator,
}: {
  annotator: AnnotatorState;
}) => {
  return annotator.workingAnnotation;
};
export const selectSelectedAnnotationIds = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): string[] => {
  return annotator.selectedAnnotationIds;
};
