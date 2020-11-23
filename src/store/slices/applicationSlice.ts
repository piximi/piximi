import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Settings } from "../../types/Settings";
import { SelectionMethod } from "../../types/SelectionMethod";

const initialState: Settings = {
  selectedImages: [],
  selectionMethod: SelectionMethod.RectangularMarquee,
  tileSize: 1,
};

export const applicationSlice = createSlice({
  name: "settings",
  initialState: initialState,
  reducers: {
    updateSelectionMethod(
      state: Settings,
      action: PayloadAction<{ selectionMethod: SelectionMethod }>
    ) {
      state.selectionMethod = action.payload.selectionMethod;
    },
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
  },
});

export const {
  updateTileSize,
  selectImage,
  selectOneImage,
  deselectImage,
  deselectImages,
  clearSelectedImages,
} = applicationSlice.actions;
