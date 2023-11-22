import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  HotkeyView,
  ApplicationSettings,
} from "../../../types/ApplicationSettings";
import { ThemeMode } from "types/ThemeMode";
import { AlertStateType, defaultAlert } from "types/AlertStateType";
import { LanguageType } from "types";

const initialState: ApplicationSettings = {
  init: false,
  tileSize: 1,
  themeMode: ThemeMode.Light,
  language: LanguageType.English,
  soundEnabled: true,
  imageSelectionColor: "#FF6DB6",
  selectedImageBorderWidth: 5,
  alertState: defaultAlert,
  hotkeyStack: [],
};

export const applicationSettingsSlice = createSlice({
  name: "application",
  initialState: initialState,
  reducers: {
    initialized(state: ApplicationSettings) {
      state.init = true;
    },
    resetApplicationSettingsSetings(state: ApplicationSettings) {
      return initialState;
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
      state: ApplicationSettings,
      action: PayloadAction<{ selectionColor: string }>
    ) {
      state.imageSelectionColor = action.payload.selectionColor;
    },
    setSelectedImageBorderWidth(
      state: ApplicationSettings,
      action: PayloadAction<{ selectionSize: number }>
    ) {
      state.selectedImageBorderWidth = action.payload.selectionSize;
    },
    setThemeMode(
      state: ApplicationSettings,
      action: PayloadAction<{ mode: ThemeMode }>
    ) {
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
      state: ApplicationSettings,
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
} = applicationSettingsSlice.actions;
