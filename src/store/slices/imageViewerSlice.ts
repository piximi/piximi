import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ImageViewerState } from "../../types/ImageViewerState";
import { Image } from "../../types/Image";
import { SelectionMode } from "../../types/SelectionMode";

const initialState: ImageViewerState = {
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
  setImageViewerSelectionMode,
} = imageViewerSlice.actions;
