import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AnnotationTool } from "utils/annotator/tools/AnnotationTool";

import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "utils/annotator/enums";

import { mutatingFilter } from "utils/common/helpers";
import { AnnotatorState } from "store/types";
import { DecodedAnnotationObject } from "store/data/types";

const initialState: AnnotatorState = {
  workingAnnotationId: undefined,

  workingAnnotation: { saved: undefined, changes: {} },
  selectedAnnotationIds: [],
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
    addSelectedAnnotationId(
      state,
      action: PayloadAction<{ annotationId: string }>
    ) {
      state.selectedAnnotationIds.push(action.payload.annotationId);
    },
    addSelectedAnnotationIds(
      state,
      action: PayloadAction<{ annotationIds: Array<string> }>
    ) {
      for (const annotationId of action.payload.annotationIds) {
        annotatorSlice.caseReducers.addSelectedAnnotationId(state, {
          type: "addSelectedAnnotationId",
          payload: { annotationId },
        });
      }
    },
    setSelectedAnnotationIds(
      state,
      action: PayloadAction<{
        annotationIds: Array<string>;
        workingAnnotationId?: string;
      }>
    ) {
      const { annotationIds, workingAnnotationId } = action.payload;
      state.selectedAnnotationIds = [];
      state.workingAnnotationId = workingAnnotationId
        ? workingAnnotationId
        : annotationIds[0];
      annotatorSlice.caseReducers.addSelectedAnnotationIds(state, {
        type: "addSelectedAnnotationIds",
        payload: { annotationIds: action.payload.annotationIds },
      });
    },

    removeSelectedAnnotationId(
      state,
      action: PayloadAction<{
        annotationId: string;
      }>
    ) {
      if (state.workingAnnotationId === action.payload.annotationId) {
        state.workingAnnotationId = undefined;
      }
      mutatingFilter(
        state.selectedAnnotationIds,
        (annotationId) => annotationId !== action.payload.annotationId
      );
    },
    removeSelectedAnnotationIds(
      state,
      action: PayloadAction<{
        annotationIds: string[];
      }>
    ) {
      for (const annotationId of action.payload.annotationIds) {
        annotatorSlice.caseReducers.removeSelectedAnnotationId(state, {
          type: "removeSelectedAnnotationId",
          payload: { annotationId },
        });
      }
    },
    setWorkingAnnotation(
      state,
      action: PayloadAction<{
        annotation: DecodedAnnotationObject | string | undefined;
        preparedByListener?: boolean;
      }>
    ) {
      const { annotation, preparedByListener } = action.payload;
      if (!preparedByListener) return;

      state.workingAnnotation.saved = annotation as
        | DecodedAnnotationObject
        | undefined;
      state.workingAnnotation.changes = {};
    },
    updateWorkingAnnotation(
      state,
      action: PayloadAction<{ changes: Partial<DecodedAnnotationObject> }>
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
