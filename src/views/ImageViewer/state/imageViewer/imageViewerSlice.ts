import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { distinctFilter, mutatingFilter } from "utils/arrayUtils";

import { ZoomMode } from "views/ImageViewer/utils/enums";

import {
  ColorAdjustmentOptionsType,
  ImageViewerState,
  ZoomToolOptionsType,
} from "../types";

const initialState: ImageViewerState = {
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
  imageOrigin: { x: 0, y: 0 },
  filters: { categoryId: [] },
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
};

export const imageViewerSlice = createSlice({
  initialState: initialState,
  name: "image-viewer",
  reducers: {
    resetImageViewer: () => initialState,

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
