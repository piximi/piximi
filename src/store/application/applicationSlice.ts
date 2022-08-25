import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HotkeyView, Settings } from "../../types/Settings";
import { ThemeMode } from "types/ThemeMode";
import { AlertStateType, defaultAlert } from "types/AlertStateType";
import { ImageShapeEnum } from "image/imageHelper";

const initialState: Settings = {
  selectedImages: [],
  tileSize: 1,
  themeMode: ThemeMode.Light,
  imageSelectionColor: "#FF6DB6",
  imageSelectionSize: 5,
  alertState: defaultAlert,
  hotkeyStack: [HotkeyView.MainImageGrid],
};

export const applicationSlice = createSlice({
  name: "settings",
  initialState: initialState,
  reducers: {
    clearSelectedImages(state: Settings) {
      state.selectedImages = [];
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

    hideAlertState(state, action: PayloadAction<{}>) {
      state.alertState.visible = false;
    },
    registerHotkeyView(
      state,
      action: PayloadAction<{ hotkeyView: HotkeyView }>
    ) {
      state.hotkeyStack.push(action.payload.hotkeyView);
    },
    selectAllImages(
      state: Settings,
      action: PayloadAction<{ ids: Array<string> }>
    ) {
      state.selectedImages = [];

      state.selectedImages = action.payload.ids;
    },
    selectImage(state: Settings, action: PayloadAction<{ id: string }>) {
      state.selectedImages.push(action.payload.id);
    },
    selectOneImage(state: Settings, action: PayloadAction<{ id: string }>) {
      state.selectedImages = [];

      state.selectedImages.push(action.payload.id);
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
    setThemeMode(state: Settings, action: PayloadAction<{ mode: ThemeMode }>) {
      state.themeMode = action.payload.mode;
    },
    unregisterHotkeyView(state, action: PayloadAction<{}>) {
      state.hotkeyStack.pop();
    },
    updateAlertState(
      state,
      action: PayloadAction<{ alertState: AlertStateType }>
    ) {
      state.alertState = action.payload.alertState;
      state.alertState.visible = true;
    },
    updateTileSize(
      state: Settings,
      action: PayloadAction<{ newValue: number }>
    ) {
      state.tileSize = action.payload.newValue!;
    },

    uploadImages(
      state,
      action: PayloadAction<{
        files: FileList;
        channels: number;
        slices: number;
        imageShapeInfo: ImageShapeEnum;
        isUploadedFromAnnotator: boolean;
      }>
    ) {},
  },
});

export const {
  clearSelectedImages,
  deselectImage,
  deselectImages,
  updateTileSize,
  hideAlertState,
  registerHotkeyView,
  selectImage,
  selectOneImage,
  setThemeMode,
  unregisterHotkeyView,
  updateAlertState,
  uploadImages,
} = applicationSlice.actions;
