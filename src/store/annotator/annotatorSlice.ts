import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AnnotatorState } from "store/types";

import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "utils/annotator/enums";
import { AnnotationTool } from "utils/annotator/tools/AnnotationTool";

const initialState: AnnotatorState = {
  annotationState: AnnotationState.Blank,
  penSelectionBrushSize: 10,
  quickSelectionRegionSize: 40,
  thresholdAnnotationValue: 150,
  selectionMode: AnnotationMode.New,
  toolType: ToolType.RectangularAnnotation,
};

export const annotatorSlice = createSlice({
  initialState: initialState,
  name: "annotator",
  reducers: {
    resetAnnotator: () => initialState,

    setAnnotationState(
      state,
      action: PayloadAction<{
        annotationState: AnnotationState;
        kind?: string;
        annotationTool: AnnotationTool;
      }>
    ) {
      state.annotationState = action.payload.annotationState;
    },

    setToolType(state, action: PayloadAction<{ operation: ToolType }>) {
      state.toolType = action.payload.operation;
    },
    setPenSelectionBrushSize(
      state,
      action: PayloadAction<{ penSelectionBrushSize: number }>
    ) {
      state.penSelectionBrushSize = action.payload.penSelectionBrushSize;
    },
    setQuickSelectionRegionSize(
      state,
      action: PayloadAction<{ quickSelectionRegionSize: number }>
    ) {
      state.quickSelectionRegionSize = action.payload.quickSelectionRegionSize;
    },

    setSelectionMode(
      state,
      action: PayloadAction<{ selectionMode: AnnotationMode }>
    ) {
      state.selectionMode = action.payload.selectionMode;
    },

    setThresholdAnnotationValue(
      state,
      action: PayloadAction<{ thresholdAnnotationValue: number }>
    ) {
      state.thresholdAnnotationValue = action.payload.thresholdAnnotationValue;
    },
  },
});
