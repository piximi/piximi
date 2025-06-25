import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { distinctFilter, mutatingFilter } from "utils/arrayUtils";

import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "store/data/constants";
import { ZoomMode } from "views/ImageViewer/utils/enums";

import { ImageViewerState } from "../../utils/types";
import {
  ColorAdjustmentOptionsType,
  ZoomToolOptionsType,
  ImageViewerImageDetails,
} from "views/ImageViewer/utils/types";

const initialState: ImageViewerState = {
  imageStack: {},
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
  filters: { categoryId: [] },
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
    mode: ZoomMode.In,
    scale: 1.0,
    toActualSize: false,
    toFit: false,
  },
  imageIsLoading: false,
  highlightedCategory: undefined,
  hasUnsavedChanges: false,
};

export const imageViewerSlice = createSlice({
  initialState: initialState,
  name: "image-viewer",
  reducers: {
    resetImageViewer: () => initialState,
    prepareImageViewer: (
      _state,
      _action: PayloadAction<{
        selectedThingIds: { images: string[]; annotations: string[] };
      }>,
    ) => {},
    setImageStack(
      state,
      action: PayloadAction<{
        images: Record<string, ImageViewerImageDetails>;
      }>,
    ) {
      state.imageStack = action.payload.images;
    },
    setHasUnsavedChanges(
      state,
      action: PayloadAction<{ hasUnsavedChanges: boolean }>,
    ) {
      state.hasUnsavedChanges = action.payload.hasUnsavedChanges;
    },
    addActiveAnnotationId(
      state,
      action: PayloadAction<{ annotationId: string }>,
    ) {
      state.activeAnnotationIds.push(action.payload.annotationId);
    },
    addActiveAnnotationIds(
      state,
      action: PayloadAction<{ annotationIds: Array<string> }>,
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
      }>,
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
      }>,
    ) {
      mutatingFilter(
        state.activeAnnotationIds,
        (annotationId) => annotationId !== action.payload.annotationId,
      );
    },
    removeActiveAnnotationIds(
      state,
      action: PayloadAction<{
        annotationIds: Array<string>;
      }>,
    ) {
      for (const annotationId of action.payload.annotationIds) {
        imageViewerSlice.caseReducers.removeActiveAnnotationId(state, {
          type: "removeActiveAnnotationId",
          payload: { annotationId },
        });
      }
    },
    setSelectedCategoryId(
      state,
      action: PayloadAction<{ selectedCategoryId: string }>,
    ) {
      state.selectedCategoryId = action.payload.selectedCategoryId;
    },
    setActiveImageId(
      state,
      action: PayloadAction<{
        imageId: string | undefined;
        prevImageId: string | undefined;
      }>,
    ) {
      state.activeImageId = action.payload.imageId;
      // reset selected annotations
    },
    setActiveImageRenderedSrcs(
      state,
      action: PayloadAction<{
        renderedSrcs: Array<string>;
      }>,
    ) {
      const activeImageId = state.activeImageId;
      if (!activeImageId)
        throw new Error("Set rendered sources failed: No active image");

      const activeImageDetails = state.imageStack[activeImageId];
      activeImageDetails.renderedSrcs[activeImageDetails.activeTimepoint] =
        action.payload.renderedSrcs;
    },
    setImageOrigin(
      state,
      action: PayloadAction<{ origin: { x: number; y: number } }>,
    ) {
      state.imageOrigin = action.payload.origin;
    },
    updateColorAdjustments(
      state,
      action: PayloadAction<{
        changes: Partial<ColorAdjustmentOptionsType>;
      }>,
    ) {
      Object.assign(state.colorAdjustment, action.payload.changes);
    },
    setCursor(
      state,
      action: PayloadAction<{
        cursor: string;
      }>,
    ) {
      state.cursor = action.payload.cursor;
    },
    setStageHeight(state, action: PayloadAction<{ stageHeight: number }>) {
      state.stageHeight = action.payload.stageHeight;
    },
    setStagePosition(
      state,
      action: PayloadAction<{ stagePosition: { x: number; y: number } }>,
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
      }>,
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
      }>,
    ) {
      Object.assign(state.zoomSelection, action.payload.changes);
    },
    setZoomToolOptions(
      state,
      action: PayloadAction<{ options: Partial<ZoomToolOptionsType> }>,
    ) {
      state.zoomOptions = { ...state.zoomOptions, ...action.payload.options };
    },
    setImageIsLoading(state, action: PayloadAction<{ isLoading: boolean }>) {
      state.imageIsLoading = action.payload.isLoading;
    },
    updateHighlightedAnnotationCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>,
    ) {
      state.highlightedCategory = action.payload.categoryId;
    },
    addFilters(
      state,
      action: PayloadAction<{
        categoryIds: string[];
      }>,
    ) {
      const newFilters = [
        ...state.filters["categoryId"],
        ...action.payload.categoryIds,
      ].filter(distinctFilter);
      state.filters["categoryId"] = newFilters;
    },
    removeFilters(
      state,
      action: PayloadAction<{
        categoryIds?: string[];
        all?: boolean;
      }>,
    ) {
      if (action.payload.all) {
        state.filters["categoryId"] = [];
        return;
      }
      if (action.payload.categoryIds) {
        mutatingFilter(
          state.filters["categoryId"],
          (id) => !action.payload.categoryIds!.includes(id),
        );
      }
    },
  },
});
