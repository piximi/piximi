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

const initialState: AnnotatorState = {
  workingAnnotation: { saved: undefined, changes: {} },
  annotationState: AnnotationState.Blank,
  penSelectionBrushSize: 10,
  quickSelectionRegionSize: 40,
  thresholdAnnotationValue: 150,
  annotationMode: AnnotationMode.New,
  pendingTargetId: undefined,
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

    /**
     * Choosing an operation always invalidates a target picked for the previous
     * one — the candidate set depends on the operation being applicable.
     */
    setAnnotationMode(
      state,
      action: PayloadAction<{ annotationMode: AnnotationMode }>,
    ) {
      state.annotationMode = action.payload.annotationMode;
      state.pendingTargetId = undefined;
    },

    setPendingTargetId(state, action: PayloadAction<string | undefined>) {
      state.pendingTargetId = action.payload;
    },

    /** Back to "commit the stroke as its own annotation", with no target. */
    clearPendingOperation(state) {
      state.annotationMode = AnnotationMode.New;
      state.pendingTargetId = undefined;
    },

    setThresholdAnnotationValue(
      state,
      action: PayloadAction<{ thresholdAnnotationValue: number }>,
    ) {
      state.thresholdAnnotationValue = action.payload.thresholdAnnotationValue;
    },
  },
});
