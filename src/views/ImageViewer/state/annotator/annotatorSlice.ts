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
  invertThresholdAnnotation: false,
  annotationMode: AnnotationMode.New,
  pendingTargetIds: [],
  toolType: ToolType.RectangularAnnotation,
};

export const annotatorSlice = createSlice({
  initialState: initialState,
  name: "annotator",
  reducers: {
    resetAnnotator: () => initialState,

    setWorkingAnnotation(
      state,
      action: PayloadAction<WorkingAnnotation | undefined>,
    ) {
      state.workingAnnotation.saved = action.payload;
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

    setToolType(state, action: PayloadAction<ToolType>) {
      state.toolType = action.payload;
    },
    setPenSelectionBrushSize(state, action: PayloadAction<number>) {
      state.penSelectionBrushSize = action.payload;
    },
    setQuickSelectionRegionSize(state, action: PayloadAction<number>) {
      state.quickSelectionRegionSize = action.payload;
    },

    /**
     * Choosing an operation always invalidates a target picked for the previous
     * one — the candidate set depends on the operation being applicable.
     */
    setAnnotationMode(state, action: PayloadAction<AnnotationMode>) {
      state.annotationMode = action.payload;
      state.pendingTargetIds = [];
    },

    togglePendingTargetIds(state, action: PayloadAction<string>) {
      const id = action.payload;
      const idx = state.pendingTargetIds.indexOf(id);
      if (idx === -1) state.pendingTargetIds.push(id);
      else state.pendingTargetIds.splice(idx, 1);
    },

    /** Back to "commit the stroke as its own annotation", with no target. */
    clearPendingOperation(state) {
      state.annotationMode = AnnotationMode.New;
      state.pendingTargetIds = [];
    },

    setThresholdAnnotationValue(state, action: PayloadAction<number>) {
      state.thresholdAnnotationValue = action.payload;
    },
    setInvertThresholdAnnotation(state, action: PayloadAction<boolean>) {
      state.invertThresholdAnnotation = action.payload;
    },
  },
});
