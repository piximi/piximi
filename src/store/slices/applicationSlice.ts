import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Settings } from "../../types/Settings";
import { ThemeMode } from "types/ThemeMode";

const initialState: Settings = {
  selectedImages: [],
  tileSize: 1,
  themeMode: ThemeMode.Light,
  imageSelectionColor: "#FF6DB6",
  imageSelectionSize: 5,
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
      state.selectedImages.push(action.payload.id);
    },
    selectOneImage(state: Settings, action: PayloadAction<{ id: string }>) {
      state.selectedImages = [];

      state.selectedImages.push(action.payload.id);
    },
    selectAllImages(
      state: Settings,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      state.selectedImages = [];

      state.selectedImages = action.payload.ids;
    },
    deselectImage(state: Settings, action: PayloadAction<{ id: string }>) {
      state.selectedImages = state.selectedImages.filter(
        (id: string) => id !== action.payload.id
      );
    },
    deselectImages(
      state: Settings,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      state.selectedImages = state.selectedImages.filter(
        (id: string) => !action.payload.ids.includes(id)
      );
    },
    clearSelectedImages(state: Settings) {
      state.selectedImages = [];
    },
    setThemeMode(state: Settings, action: PayloadAction<{ mode: ThemeMode }>) {
      state.themeMode = action.payload.mode;
    },
    setImageSelectionColor(
      state: Settings,
      action: PayloadAction<{ selectionColor: string }>
    ) {
      state.imageSelectionColor = action.payload.selectionColor;
    },
    setImageSelectionSize(
      state: Settings,
      action: PayloadAction<{ selectionSize: number }>
    ) {
      state.imageSelectionSize = action.payload.selectionSize;
    },
  },
});

export const {
  updateTileSize,
  selectImage,
  selectOneImage,
  deselectImage,
  deselectImages,
  clearSelectedImages,
  setThemeMode,
} = applicationSlice.actions;
