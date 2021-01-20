import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ImageViewerState } from "../../types/ImageViewerState";
import { Image } from "../../types/Image";
import { SelectionMode } from "../../types/SelectionMode";
import { ImageViewerOperation } from "../../types/ImageViewerOperation";

const initialState: ImageViewerState = {
  operation: ImageViewerOperation.RectangularSelection,
  selectionMode: SelectionMode.New,
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
      action: PayloadAction<{ selectionMode: SelectionMode }>
    ) {
      state.selectionMode = action.payload.selectionMode;
    },
  },
});

export const {
  setImageViewerImage,
  setImageViewerOperation,
  setImageViewerSelectionMode,
} = imageViewerSlice.actions;
