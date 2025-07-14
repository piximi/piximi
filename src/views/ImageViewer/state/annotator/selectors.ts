import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "views/ImageViewer/utils/enums";

import { AnnotatorState } from "../../utils/types";

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
export const selectWorkingAnnotationId = ({
  annotator,
}: {
  annotator: AnnotatorState;
}): string | undefined => {
  return annotator.workingAnnotationId;
};
export const selectWorkingAnnotationEntity = ({
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

export const selectChanges = ({ annotator }: { annotator: AnnotatorState }) => {
  return annotator.changes;
};

export const selectKindChanges = ({
  annotator,
}: {
  annotator: AnnotatorState;
}) => {
  return annotator.changes.kinds;
};

export const selectCategoryChanges = ({
  annotator,
}: {
  annotator: AnnotatorState;
}) => {
  return annotator.changes.categories;
};

export const selectThingChanges = ({
  annotator,
}: {
  annotator: AnnotatorState;
}) => {
  return annotator.changes.things;
};

export const selectAnnotationChanges = ({
  annotator,
}: {
  annotator: AnnotatorState;
}) => {
  return annotator.changes.annotations;
};
