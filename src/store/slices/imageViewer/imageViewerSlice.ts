import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  ImageViewer,
  ColorAdjustmentOptionsType,
  ZoomModeType,
  ZoomToolOptionsType,
  DecodedAnnotationType,
} from "types";
import { NewDecodedAnnotationType } from "types/AnnotationType";

import { distinctFilter, mutatingFilter } from "utils/common/helpers";

const initialState: ImageViewer = {
  imageStack: [],

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
  cursor: "default",
  activeImageId: undefined,
  activeAnnotationIds: [],
  activeImageRenderedSrcs: [],
  imageOrigin: { x: 0, y: 0 },
  annotationFilters: { categoryId: [] },
  workingAnnotationId: undefined,

  workingAnnotation: { saved: undefined, changes: {} },
  workingAnnotationNew: { saved: undefined, changes: {} },
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
    automaticCentering: true,
    mode: ZoomModeType.In,
    scale: 1.0,
    toActualSize: false,
    toFit: false,
  },
  imageIsLoading: false,
  highlightedCategory: undefined,
};

export const imageViewerSlice = createSlice({
  initialState: initialState,
  name: "image-viewer",
  reducers: {
    resetImageViewer: () => initialState,
    prepareImageViewer: (
      state,
      action: PayloadAction<{ selectedThingIds: string[] }>
    ) => {},
    setImageStack(state, action: PayloadAction<{ imageIds: string[] }>) {
      state.imageStack = action.payload.imageIds;
    },
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
      action: PayloadAction<{
        annotation: DecodedAnnotationType | string | undefined;
      }>
    ) {
      const { annotation } = action.payload;
      if (typeof annotation === "string") {
        //managed in listener
        return;
      } else {
        state.workingAnnotation.saved = action.payload.annotation as
          | DecodedAnnotationType
          | undefined;
        state.workingAnnotation.changes = {};
      }
    },
    updateWorkingAnnotation(
      state,
      action: PayloadAction<{ changes: Partial<DecodedAnnotationType> }>
    ) {
      if (state.workingAnnotation.saved) {
        state.workingAnnotation.changes = action.payload.changes;
      }
    },
    setWorkingAnnotationNew(
      state,
      action: PayloadAction<{
        annotation: NewDecodedAnnotationType | string | undefined;
        preparedByListener?: boolean;
      }>
    ) {
      const { annotation, preparedByListener } = action.payload;
      if (!preparedByListener) return;

      state.workingAnnotationNew.saved = annotation as
        | NewDecodedAnnotationType
        | undefined;
      state.workingAnnotationNew.changes = {};
    },
    updateWorkingAnnotationNew(
      state,
      action: PayloadAction<{ changes: Partial<NewDecodedAnnotationType> }>
    ) {
      if (state.workingAnnotationNew.saved) {
        state.workingAnnotationNew.changes = action.payload.changes;
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
    setActiveImageIdNew(
      state,
      action: PayloadAction<{
        imageId: string | undefined;
        prevImageId: string | undefined;
      }>
    ) {
      state.activeImageId = action.payload.imageId;
      // reset selected annotations
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
      action: PayloadAction<{ options: Partial<ZoomToolOptionsType> }>
    ) {
      state.zoomOptions = { ...state.zoomOptions, ...action.payload.options };
    },
    setImageIsLoading(state, action: PayloadAction<{ isLoading: boolean }>) {
      state.imageIsLoading = action.payload.isLoading;
    },
    updateHighlightedAnnotationCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>
    ) {
      state.highlightedCategory = action.payload.categoryId;
    },
    addAnnotationCategoryFilters(
      state,
      action: PayloadAction<{
        categoryIds: string[];
      }>
    ) {
      const newFilters = [
        ...state.annotationFilters["categoryId"],
        ...action.payload.categoryIds,
      ].filter(distinctFilter);
      state.annotationFilters["categoryId"] = newFilters;
    },
    removeAnnotationCategoryFilters(
      state,
      action: PayloadAction<{
        categoryIds?: string[];
        all?: boolean;
      }>
    ) {
      if (action.payload.all) {
        state.annotationFilters["categoryId"] = [];
        return;
      }
      if (action.payload.categoryIds) {
        mutatingFilter(
          state.annotationFilters["categoryId"],
          (id) => !action.payload.categoryIds!.includes(id)
        );
      }
    },
  },
});

export const {
  setActiveImageId,
  setActiveImageRenderedSrcs,
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
  setWorkingAnnotation,
  updateHighlightedAnnotationCategory,
} = imageViewerSlice.actions;
