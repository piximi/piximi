import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  ToolType,
  AnnotationModeType,
  AnnotationStateType,
  LanguageType,
  ImageViewer,
} from "types";

import { AnnotationTool } from "annotator-tools";

import { mutatingFilter } from "utils/common/helpers";

const initialState: ImageViewer = {
  annotationState: AnnotationStateType.Blank,
  brightness: 0,
  currentIndex: 0,
  cursor: "default",
  contrast: 0,
  exposure: 0,
  hue: 0,
  activeImageId: undefined,
  activeAnnotationIds: [],
  activeImageRenderedSrcs: [],
  language: LanguageType.English,
  imageOrigin: { x: 0, y: 0 },
  hiddenCategoryIds: [],
  penSelectionBrushSize: 10,
  pointerSelection: {
    dragging: false,
    minimum: undefined,
    maximum: undefined,
    selecting: false,
  },
  quickSelectionRegionSize: 40,
  thresholdAnnotationValue: 150,
  saturation: 0,
  workingAnnotationId: undefined,
  selectedAnnotationIds: [],
  stagedAnnotationIds: [],
  stagedAnnotationsHaveBeenUpdated: false,
  selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
  selectionMode: AnnotationModeType.New,
  soundEnabled: true,
  stageHeight: 1000,
  stageScale: 1,
  stageWidth: 1000,
  stagePosition: { x: 0, y: 0 },
  toolType: ToolType.RectangularAnnotation,
  vibrance: 0,
  zoomSelection: {
    dragging: false,
    minimum: undefined,
    maximum: undefined,
    selecting: false,
    centerPoint: undefined,
  },
};

export const imageViewerSlice = createSlice({
  initialState: initialState,
  name: "image-viewer",
  reducers: {
    resetAnnotator: () => initialState,

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
    deleteActiveAnnotationId(
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
    deleteActiveAnnotationIds(
      state,
      action: PayloadAction<{
        annotationIds: Array<string>;
      }>
    ) {
      mutatingFilter(
        state.activeAnnotationIds,
        (annotationId) => !action.payload.annotationIds.includes(annotationId)
      );
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
        categoryIds: string[];
      }>
    ) {
      for (const categoryId of action.payload.categoryIds) {
        imageViewerSlice.caseReducers.showCategory(state, {
          type: "showCategory",
          payload: { categoryId },
        });
      }
    },
    showAllCategories(state, action: PayloadAction<{}>) {
      state.hiddenCategoryIds = [];
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

    setActiveImageRenderedSrcs(
      state,
      action: PayloadAction<{
        renderedSrcs: Array<string>;
      }>
    ) {
      state.activeImageRenderedSrcs = action.payload.renderedSrcs;
    },
    setAnnotationState(
      state,
      action: PayloadAction<{
        annotationState: AnnotationStateType;
        annotationTool: AnnotationTool | undefined;
        execSaga: boolean;
      }>
    ) {
      state.annotationState = action.payload.annotationState;
    },
    setBrightness(state, action: PayloadAction<{ brightness: number }>) {
      state.brightness = action.payload.brightness;
    },
    setContrast(state, action: PayloadAction<{ contrast: number }>) {
      state.contrast = action.payload.contrast;
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
    setExposure(state, action: PayloadAction<{ exposure: number }>) {
      state.exposure = action.payload.exposure;
    },
    setHue(state, action: PayloadAction<{ hue: number }>) {
      state.hue = action.payload.hue;
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
      state.stagedAnnotationIds = [];
      state.workingAnnotationId = undefined;
    },
    setImageOrigin(
      state,
      action: PayloadAction<{ origin: { x: number; y: number } }>
    ) {
      state.imageOrigin = action.payload.origin;
    },
    setLanguage(state, action: PayloadAction<{ language: LanguageType }>) {
      state.language = action.payload.language;
    },
    setOperation(state, action: PayloadAction<{ operation: ToolType }>) {
      state.toolType = action.payload.operation;
    },
    setPenSelectionBrushSize(
      state,
      action: PayloadAction<{ penSelectionBrushSize: number }>
    ) {
      state.penSelectionBrushSize = action.payload.penSelectionBrushSize;
    },
    setPointerSelection(
      state,
      action: PayloadAction<{
        pointerSelection: {
          dragging: boolean;
          minimum: { x: number; y: number } | undefined;
          maximum: { x: number; y: number } | undefined;
          selecting: boolean;
        };
      }>
    ) {
      state.pointerSelection = action.payload.pointerSelection;
    },
    setQuickSelectionRegionSize(
      state,
      action: PayloadAction<{ quickSelectionRegionSize: number }>
    ) {
      state.quickSelectionRegionSize = action.payload.quickSelectionRegionSize;
    },
    setSaturation(state, action: PayloadAction<{ saturation: number }>) {
      state.saturation = action.payload.saturation;
    },
    setSelectedAnnotationIds(
      state,
      action: PayloadAction<{
        selectedAnnotationIds: Array<string>;
        workingAnnotationId: string | undefined;
      }>
    ) {
      state.selectedAnnotationIds = action.payload.selectedAnnotationIds;

      state.workingAnnotationId = action.payload.workingAnnotationId;
    },
    setAllSelectedAnnotationIds(state, action: PayloadAction<{}>) {
      state.selectedAnnotationIds = state.activeAnnotationIds;

      state.workingAnnotationId =
        state.workingAnnotationId ?? state.activeAnnotationIds[0];
    },
    setSelectedCategoryId(
      state,
      action: PayloadAction<{ selectedCategoryId: string; execSaga: boolean }>
    ) {
      state.selectedCategoryId = action.payload.selectedCategoryId;
    },
    setSelectionMode(
      state,
      action: PayloadAction<{ selectionMode: AnnotationModeType }>
    ) {
      state.selectionMode = action.payload.selectionMode;
    },
    setSoundEnabled(state, action: PayloadAction<{ soundEnabled: boolean }>) {
      state.soundEnabled = action.payload.soundEnabled;
    },
    setStagedAnnotationIds(
      state,
      action: PayloadAction<{ annotationIds: string[] }>
    ) {
      state.stagedAnnotationIds = action.payload.annotationIds;
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
    setThresholdAnnotationValue(
      state,
      action: PayloadAction<{ thresholdAnnotationValue: number }>
    ) {
      state.thresholdAnnotationValue = action.payload.thresholdAnnotationValue;
    },
    setVibrance(state, action: PayloadAction<{ vibrance: number }>) {
      state.vibrance = action.payload.vibrance;
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
  },
});

export const {
  setActiveImageId,
  setActiveImageRenderedSrcs,
  setAnnotationState,
  setBrightness,
  setContrast,
  setCurrentIndex,
  setCursor,
  setExposure,
  setHue,
  setLanguage,
  setImageOrigin,
  setOperation,
  setPenSelectionBrushSize,
  setPointerSelection,
  setQuickSelectionRegionSize,
  setSaturation,
  setSelectedAnnotationIds,
  setSelectionMode,
  setSelectedCategoryId,
  setSoundEnabled,
  setStagedAnnotationIds,
  setStageHeight,
  setStagePosition,
  setStageScale,
  setStageWidth,
  setVibrance,
  setZoomSelection,
} = imageViewerSlice.actions;
