import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AnnotationTool } from "views/ImageViewer/utils/tools/AnnotationTool";

import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "views/ImageViewer/utils/enums";

import { AnnotatorState, ProtoAnnotationObject } from "../types";

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
        annotation: ProtoAnnotationObject | string | undefined;
        preparedByListener?: boolean;
      }>,
    ) {
      const preparedByListener = action.payload.preparedByListener;
      if (!preparedByListener) return;
      const annotation = action.payload.annotation as
        | ProtoAnnotationObject
        | undefined;
      state.workingAnnotation.saved = annotation;
      state.workingAnnotation.changes = {};
      state.workingAnnotationId = annotation?.id;
    },
    updateWorkingAnnotation(
      state,
      action: PayloadAction<{ changes: Partial<ProtoAnnotationObject> }>,
    ) {
      if (state.workingAnnotation.saved) {
        state.workingAnnotation.changes = action.payload.changes;
      }
    },

    setAnnotationState(
      state,
      action: PayloadAction<{
        annotationState: AnnotationState;
        kind?: string;
        annotationTool: AnnotationTool;
      }>,
    ) {
      state.annotationState = action.payload.annotationState;
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
