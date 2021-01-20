import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ImageViewerState } from "../../types/ImageViewerState";
import { Image } from "../../types/Image";
import { ImageViewerSelectionMode } from "../../types/ImageViewerSelectionMode";
import { ImageViewerOperation } from "../../types/ImageViewerOperation";
import { ImageViewerZoomMode } from "../../types/ImageViewerZoomMode";

const initialState: ImageViewerState = {
  operation: ImageViewerOperation.RectangularSelection,
  selectionMode: ImageViewerSelectionMode.New,
  zoomMode: ImageViewerZoomMode.In,
};

export const imageViewerSlice = createSlice({
  initialState: initialState,
  name: "image-viewer",
  reducers: {
    setImageViewerImage(
      state: ImageViewerState,
      action: PayloadAction<{ image: Image }>
    ) {
      state.image = action.payload.image;
    },
    setImageViewerOperation(
      state: ImageViewerState,
      action: PayloadAction<{ operation: ImageViewerOperation }>
    ) {
      state.operation = action.payload.operation;
    },
    setImageViewerSelectionMode(
      state: ImageViewerState,
      action: PayloadAction<{ selectionMode: ImageViewerSelectionMode }>
    ) {
      state.selectionMode = action.payload.selectionMode;
    },
    setImageViewerZoomMode(
      state: ImageViewerState,
      action: PayloadAction<{ zoomMode: ImageViewerZoomMode }>
    ) {
      state.zoomMode = action.payload.zoomMode;
    },
  },
});

export const {
  setImageViewerImage,
  setImageViewerOperation,
  setImageViewerSelectionMode,
  setImageViewerZoomMode,
} = imageViewerSlice.actions;
