import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { defaultAlert } from "utils/common/constants";
import { AlertState } from "utils/common/types";
import { HotkeyView, Languages } from "utils/common/enums";
import { ThemeMode } from "themes/enums";
import { AppSettingsState } from "store/types";

const initialState: AppSettingsState = {
  init: false,
  tileSize: 1,
  themeMode: ThemeMode.Light,
  language: Languages.English,
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
    initialized(state: AppSettingsState) {
      state.init = true;
    },
    resetApplicationSettingsSetings(state: AppSettingsState) {
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
    setLanguage(state, action: PayloadAction<{ language: Languages }>) {
      state.language = action.payload.language;
    },
    setImageSelectionColor(
      state: AppSettingsState,
      action: PayloadAction<{ selectionColor: string }>
    ) {
      state.imageSelectionColor = action.payload.selectionColor;
    },
    setSelectedImageBorderWidth(
      state: AppSettingsState,
      action: PayloadAction<{ selectionSize: number }>
    ) {
      state.selectedImageBorderWidth = action.payload.selectionSize;
    },
    setThemeMode(
      state: AppSettingsState,
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
    updateAlertState(state, action: PayloadAction<{ alertState: AlertState }>) {
      state.alertState = action.payload.alertState;
      state.alertState.visible = true;
    },
    updateTileSize(
      state: AppSettingsState,
      action: PayloadAction<{ newValue: number }>
    ) {
      state.tileSize = action.payload.newValue!;
    },
  },
});
