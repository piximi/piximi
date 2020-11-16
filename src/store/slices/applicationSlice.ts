import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Settings } from "../../types/Settings";

const initialState: Settings = {
  tileSize: 1,
  selectedImages: new Set([]),
};

export const applicationSlice = createSlice({
  name: "settings",
  initialState: initialState,
  reducers: {
    updateTileSize(
      state: Settings,
      action: PayloadAction<{ newValue: number }>
    ) {
      state.tileSize = action.payload.newValue!;
    },
    selectImage(state: Settings, action: PayloadAction<{ id: string }>) {
      state.selectedImages.add(action.payload.id);
    },
    selectAllImages(
      state: Settings,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      state.selectedImages.clear();

      state.selectedImages = new Set(action.payload.ids);
    },
    deselectImage(state: Settings, action: PayloadAction<{ id: string }>) {
      state.selectedImages.delete(action.payload.id);
    },
    clearSelectedImages(state: Settings) {
      state.selectedImages.clear();
    },
  },
});

export const {
  updateTileSize,
  selectImage,
  deselectImage,
  clearSelectedImages,
} = applicationSlice.actions;
