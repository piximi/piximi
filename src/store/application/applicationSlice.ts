import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HotkeyView, Settings } from "../../types/Settings";
import { ThemeMode } from "types/ThemeMode";
import { AlertStateType, defaultAlert } from "types/AlertStateType";
import { LanguageType } from "types";

const initialState: Settings = {
  init: false,
  selectedImages: [],
  tileSize: 1,
  themeMode: ThemeMode.Light,
  language: LanguageType.English,
  soundEnabled: true,
  imageSelectionColor: "#FF6DB6",
  selectedImageBorderWidth: 5,
  alertState: defaultAlert,
  hotkeyStack: [],
};

export const applicationSlice = createSlice({
  name: "settings",
  initialState: initialState,
  reducers: {
    initialized(state: Settings) {
      state.init = true;
    },
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
    setLanguage(state, action: PayloadAction<{ language: LanguageType }>) {
      state.language = action.payload.language;
    },
    setImageSelectionColor(
      state: Settings,
      action: PayloadAction<{ selectionColor: string }>
    ) {
      state.imageSelectionColor = action.payload.selectionColor;
    },
    setSelectedImageBorderWidth(
      state: Settings,
      action: PayloadAction<{ selectionSize: number }>
    ) {
      state.selectedImageBorderWidth = action.payload.selectionSize;
    },
    setThemeMode(state: Settings, action: PayloadAction<{ mode: ThemeMode }>) {
      state.themeMode = action.payload.mode;
    },
    setSoundEnabled(state, action: PayloadAction<{ soundEnabled: boolean }>) {
      state.soundEnabled = action.payload.soundEnabled;
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
  },
});

export const {
  updateTileSize,
  hideAlertState,
  registerHotkeyView,
  setThemeMode,
  unregisterHotkeyView,
  updateAlertState,
} = applicationSlice.actions;
