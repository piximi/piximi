import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ToolOptionsStateType } from "../../types/ToolOptionsStateType";
import { ZoomModeType } from "../../types/ZoomModeType";
import { ZoomToolOptionsType } from "../../types/ZoomToolOptionsType";
import { ColorAdjustmentOptionsType } from "../../types/ColorAdjustmentOptionsType";

const initialState: ToolOptionsStateType = {
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
  zoom: {
    automaticCentering: true,
    mode: ZoomModeType.In,
    scale: 1.0,
    toActualSize: false,
    toFit: false,
  },
};

export const toolOptionsSlice = createSlice({
  initialState: initialState,
  name: "image-viewer-tool-options",
  reducers: {
    setColorAdjustmentOptions(
      state: ToolOptionsStateType,
      action: PayloadAction<{ options: ColorAdjustmentOptionsType }>
    ) {
      state.colorAdjustment = action.payload.options;
    },
    setZoomToolOptions(
      state: ToolOptionsStateType,
      action: PayloadAction<{ options: ZoomToolOptionsType }>
    ) {
      state.zoom = action.payload.options;
    },
  },
});

export const { setZoomToolOptions } = toolOptionsSlice.actions;
