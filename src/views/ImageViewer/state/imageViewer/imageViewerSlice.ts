import { createSlice } from "@reduxjs/toolkit";

import { projectReset } from "store/actions";

import { ZoomMode } from "@ImageViewer/utils/enums";

import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  ZoomToolOptionsType,
  ImageViewerState,
} from "@ImageViewer/utils/types";

const initialState: ImageViewerState = {
  stagePosition: { x: 0, y: 0 },
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

    setStagePosition(
      state,
      action: PayloadAction<{ stagePosition: { x: number; y: number } }>,
    ) {
      state.stagePosition = action.payload.stagePosition;
    },

    setZoomToolOptions(
      state,
      action: PayloadAction<{ options: Partial<ZoomToolOptionsType> }>,
    ) {
      state.zoomOptions = { ...state.zoomOptions, ...action.payload.options };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(projectReset, () => ({ ...initialState }));
  },
});
