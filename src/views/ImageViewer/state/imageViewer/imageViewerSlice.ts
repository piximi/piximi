import { createSlice } from "@reduxjs/toolkit";

import { ToolType, ZoomMode } from "views/ImageViewer/utils/enums";

import { annotatorSlice } from "../annotator";

import type {
  ColorAdjustmentOptionsType,
  ZoomToolOptionsType,
  ImageViewerState,
} from "views/ImageViewer/utils/types";
import type { PayloadAction } from "@reduxjs/toolkit";

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
};

export const imageViewerSlice = createSlice({
  initialState: initialState,
  name: "image-viewer",
  reducers: {
    resetImageViewer: () => initialState,
    prepareImageViewer: (
      _state,
      _action: PayloadAction<{ selectedThingIds: string[] }>,
    ) => {},

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
  },
  extraReducers(builder) {
    builder.addCase(annotatorSlice.actions.setToolType, (state, action) => {
      const { operation } = action.payload;

      switch (operation) {
        case ToolType.RectangularAnnotation:
        case ToolType.EllipticalAnnotation:
          state.cursor = "crosshair";
          break;
        case ToolType.PenAnnotation:
          state.cursor = "none";
          break;
        default:
          state.cursor = "pointer";
      }
    });
  },
});
