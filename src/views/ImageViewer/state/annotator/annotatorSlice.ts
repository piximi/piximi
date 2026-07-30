import { createSlice } from "@reduxjs/toolkit";

import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "views/ImageViewer/utils/enums";

import type {
  AnnotatorState,
  WorkingAnnotation,
} from "views/ImageViewer/utils/types";
import type { PayloadAction } from "@reduxjs/toolkit";

export const initialState: AnnotatorState = {
  workingAnnotationId: undefined,
  workingAnnotation: { saved: undefined, changes: {} },
  annotationState: AnnotationState.Blank,
  penSelectionBrushSize: 10,
  quickSelectionRegionSize: 40,
  thresholdAnnotationValue: 150,
  annotationMode: AnnotationMode.New,
  toolType: ToolType.RectangularAnnotation,
};

export const annotatorSlice = createSlice({
  initialState: initialState,
  name: "annotator",
  reducers: {
    resetAnnotator: () => initialState,

    setWorkingAnnotation(
      state,
      action: PayloadAction<{
        annotation: WorkingAnnotation | undefined;
      }>,
    ) {
      const { annotation } = action.payload;

      state.workingAnnotation.saved = annotation;
      state.workingAnnotation.changes = {};
    },
    updateWorkingAnnotation(
      state,
      action: PayloadAction<{ changes: Partial<WorkingAnnotation> }>,
    ) {
      if (state.workingAnnotation.saved) {
        state.workingAnnotation.changes = action.payload.changes;
      }
    },

    setAnnotationState(state, action: PayloadAction<AnnotationState>) {
      state.annotationState = action.payload;
    },

    setToolType(state, action: PayloadAction<{ operation: ToolType }>) {
      state.toolType = action.payload.operation;
    },
    setPenSelectionBrushSize(
      state,
      action: PayloadAction<{ penSelectionBrushSize: number }>,
    ) {
      state.penSelectionBrushSize = action.payload.penSelectionBrushSize;
    },
    setQuickSelectionRegionSize(
      state,
      action: PayloadAction<{ quickSelectionRegionSize: number }>,
    ) {
      state.quickSelectionRegionSize = action.payload.quickSelectionRegionSize;
    },

    setAnnotationMode(
      state,
      action: PayloadAction<{ annotationMode: AnnotationMode }>,
    ) {
      state.annotationMode = action.payload.annotationMode;
    },

    setThresholdAnnotationValue(
      state,
      action: PayloadAction<{ thresholdAnnotationValue: number }>,
    ) {
      state.thresholdAnnotationValue = action.payload.thresholdAnnotationValue;
    },
  },
});
