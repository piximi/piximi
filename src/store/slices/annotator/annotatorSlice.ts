import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  ToolType,
  AnnotationModeType,
  AnnotationStateType,
  Annotator,
} from "types";

import { AnnotationTool } from "annotator-tools-new";
import { AnnotationToolNew } from "annotator-tools-new/AnnotationTool/AnnotationTool";

const initialState: Annotator = {
  annotationState: AnnotationStateType.Blank,
  penSelectionBrushSize: 10,
  quickSelectionRegionSize: 40,
  thresholdAnnotationValue: 150,
  selectionMode: AnnotationModeType.New,
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
        annotationState: AnnotationStateType;
        annotationTool: AnnotationTool;
      }>
    ) {
      state.annotationState = action.payload.annotationState;
    },
    setAnnotationStateNew(
      state,
      action: PayloadAction<{
        annotationState: AnnotationStateType;
        kind?: string;
        annotationTool: AnnotationToolNew;
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
      action: PayloadAction<{ selectionMode: AnnotationModeType }>
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

export const {
  setAnnotationState,
  setPenSelectionBrushSize,
  setQuickSelectionRegionSize,
  setSelectionMode,
  setToolType,
} = annotatorSlice.actions;
