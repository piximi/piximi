import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  ImageViewerStore,
  ColorAdjustmentOptionsType,
  AnnotationType,
  ZoomModeType,
  ZoomToolOptionsType,
} from "types";

import { mutatingFilter } from "utils/common/helpers";

const initialState: ImageViewerStore = {
  colorAdjustment: {
    blackPoint: 0,
    brightness: 0,
    contrast: 0,
    exposure: 0,
    highlights: 0,
    hue: 0,
    saturation: 0,
    shadows: 0,
    vibrance: 0,
  },
  currentIndex: 0,
  cursor: "default",
  activeImageId: undefined,
  activeAnnotationIds: [],
  activeImageRenderedSrcs: [],
  imageOrigin: { x: 0, y: 0 },
  hiddenCategoryIds: [],
  workingAnnotationId: undefined,
  workingAnnotation: undefined,
  selectedAnnotationIds: [],
  selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
  stageHeight: 1000,
  stageScale: 1,
  stageWidth: 1000,
  stagePosition: { x: 0, y: 0 },
  zoomSelection: {
    dragging: false,
    minimum: undefined,
    maximum: undefined,
    selecting: false,
    centerPoint: undefined,
  },
  zoomOptions: {
    automaticCentering: false,
    mode: ZoomModeType.In,
    scale: 1.0,
    toActualSize: false,
    toFit: false,
  },
};

export const imageViewerSlice = createSlice({
  initialState: initialState,
  name: "image-viewer",
  reducers: {
    resetImageViewer: () => initialState,
    addActiveAnnotationId(
      state,
      action: PayloadAction<{ annotationId: string }>
    ) {
      state.activeAnnotationIds.push(action.payload.annotationId);
    },
    addActiveAnnotationIds(
      state,
      action: PayloadAction<{ annotationIds: Array<string> }>
    ) {
      for (const annotationId of action.payload.annotationIds) {
        imageViewerSlice.caseReducers.addActiveAnnotationId(state, {
          type: "addActiveAnnotationId",
          payload: { annotationId },
        });
      }
    },
    setActiveAnnotationIds(
      state,
      action: PayloadAction<{
        annotationIds: Array<string>;
      }>
    ) {
      state.activeAnnotationIds = [];
      imageViewerSlice.caseReducers.addActiveAnnotationIds(state, {
        type: "addActiveAnnotationIds",
        payload: { annotationIds: action.payload.annotationIds },
      });
    },
    removeActiveAnnotationId(
      state,
      action: PayloadAction<{
        annotationId: string;
      }>
    ) {
      mutatingFilter(
        state.activeAnnotationIds,
        (annotationId) => annotationId !== action.payload.annotationId
      );
    },
    removeActiveAnnotationIds(
      state,
      action: PayloadAction<{
        annotationIds: Array<string>;
      }>
    ) {
      for (const annotationId of action.payload.annotationIds) {
        imageViewerSlice.caseReducers.removeActiveAnnotationId(state, {
          type: "removeActiveAnnotationId",
          payload: { annotationId },
        });
      }
    },
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
        imageViewerSlice.caseReducers.addSelectedAnnotationId(state, {
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
      imageViewerSlice.caseReducers.addSelectedAnnotationIds(state, {
        type: "addSelectedAnnotationIds",
        payload: { annotationIds: action.payload.annotationIds },
      });
    },
    setAllSelectedAnnotationIds(state, action: PayloadAction<{}>) {
      state.selectedAnnotationIds = [];
      imageViewerSlice.caseReducers.addSelectedAnnotationIds(state, {
        type: "addSelectedAnnotationIds",
        payload: { annotationIds: state.activeAnnotationIds },
      });

      state.workingAnnotationId =
        state.workingAnnotationId ?? state.activeAnnotationIds[0];
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
        imageViewerSlice.caseReducers.removeSelectedAnnotationId(state, {
          type: "removeSelectedAnnotationId",
          payload: { annotationId },
        });
      }
    },
    setWorkingAnnotation(
      state,
      action: PayloadAction<{ annotation: AnnotationType | undefined }>
    ) {
      state.workingAnnotation = action.payload.annotation;
    },
    updateWorkingAnnotation(
      state,
      action: PayloadAction<{ changes: Partial<AnnotationType> }>
    ) {
      if (!state.workingAnnotation) return;
      Object.assign(state.workingAnnotation, action.payload.changes);
    },
    hideCategory(
      state,
      action: PayloadAction<{
        categoryId: string;
      }>
    ) {
      !state.hiddenCategoryIds.includes(action.payload.categoryId) &&
        state.hiddenCategoryIds.push(action.payload.categoryId);
    },
    hideCategories(
      state,
      action: PayloadAction<{
        categoryIds: string[];
      }>
    ) {
      for (const categoryId of action.payload.categoryIds) {
        imageViewerSlice.caseReducers.hideCategory(state, {
          type: "hideCategory",
          payload: { categoryId },
        });
      }
    },
    showCategory(
      state,
      action: PayloadAction<{
        categoryId: string;
      }>
    ) {
      mutatingFilter(
        state.hiddenCategoryIds,
        (categoryId) => categoryId !== action.payload.categoryId
      );
    },
    showCategories(
      state,
      action: PayloadAction<{
        categoryIds?: string[];
      }>
    ) {
      if (!action.payload.categoryIds) {
        state.hiddenCategoryIds = [];
        return;
      }
      for (const categoryId of action.payload.categoryIds) {
        imageViewerSlice.caseReducers.showCategory(state, {
          type: "showCategory",
          payload: { categoryId },
        });
      }
    },
    toggleCategoryVisibility(
      state,
      action: PayloadAction<{
        categoryId: string;
      }>
    ) {
      const { categoryId } = action.payload;
      if (state.hiddenCategoryIds.includes(categoryId)) {
        mutatingFilter(
          state.hiddenCategoryIds,
          (id) => id !== action.payload.categoryId
        );
      } else {
        state.hiddenCategoryIds.push(categoryId);
      }
    },
    setSelectedCategoryId(
      state,
      action: PayloadAction<{ selectedCategoryId: string; execSaga: boolean }>
    ) {
      state.selectedCategoryId = action.payload.selectedCategoryId;
    },
    setActiveImageId(
      state,
      action: PayloadAction<{
        imageId: string | undefined;
        prevImageId: string | undefined;
        execSaga: boolean;
      }>
    ) {
      state.activeImageId = action.payload.imageId;
      // reset selected annotations
      state.selectedAnnotationIds = [];
      state.workingAnnotationId = undefined;
    },
    setActiveImageRenderedSrcs(
      state,
      action: PayloadAction<{
        renderedSrcs: Array<string>;
      }>
    ) {
      state.activeImageRenderedSrcs = action.payload.renderedSrcs;
    },
    setImageOrigin(
      state,
      action: PayloadAction<{ origin: { x: number; y: number } }>
    ) {
      state.imageOrigin = action.payload.origin;
    },
    updateColorAdjustments(
      state,
      action: PayloadAction<{
        changes: Partial<ColorAdjustmentOptionsType>;
      }>
    ) {
      Object.assign(state.colorAdjustment, action.payload.changes);
    },
    setCurrentIndex(state, action: PayloadAction<{ currentIndex: number }>) {
      state.currentIndex = action.payload.currentIndex;
    },
    setCursor(
      state,
      action: PayloadAction<{
        cursor: string;
      }>
    ) {
      state.cursor = action.payload.cursor;
    },
    setStageHeight(state, action: PayloadAction<{ stageHeight: number }>) {
      state.stageHeight = action.payload.stageHeight;
    },
    setStagePosition(
      state,
      action: PayloadAction<{ stagePosition: { x: number; y: number } }>
    ) {
      state.stagePosition = action.payload.stagePosition;
    },
    setStageScale(state, action: PayloadAction<{ stageScale: number }>) {
      state.stageScale = action.payload.stageScale;
    },
    setStageWidth(state, action: PayloadAction<{ stageWidth: number }>) {
      state.stageWidth = action.payload.stageWidth;
    },
    setZoomSelection(
      state,
      action: PayloadAction<{
        zoomSelection: {
          dragging: boolean;
          minimum: { x: number; y: number } | undefined;
          maximum: { x: number; y: number } | undefined;
          selecting: boolean;
          centerPoint: { x: number; y: number } | undefined;
        };
      }>
    ) {
      state.zoomSelection = action.payload.zoomSelection;
    },
    updateZoomSelection(
      state,
      action: PayloadAction<{
        changes: Partial<{
          dragging: boolean;
          minimum: { x: number; y: number } | undefined;
          maximum: { x: number; y: number } | undefined;
          selecting: boolean;
          centerPoint: { x: number; y: number } | undefined;
        }>;
      }>
    ) {
      Object.assign(state.zoomSelection, action.payload.changes);
    },
    setZoomToolOptions(
      state,
      action: PayloadAction<{ options: ZoomToolOptionsType }>
    ) {
      state.zoomOptions = action.payload.options;
    },
  },
});

export const {
  setActiveImageId,
  setActiveImageRenderedSrcs,
  setCurrentIndex,
  setCursor,
  setImageOrigin,
  setSelectedAnnotationIds,
  setSelectedCategoryId,
  setStageHeight,
  setStagePosition,
  setStageScale,
  setStageWidth,
  setZoomSelection,
  setZoomToolOptions,
} = imageViewerSlice.actions;