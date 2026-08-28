import { createSlice } from "@reduxjs/toolkit";

import type { AppSettingsState } from "store/types";

import { logger } from "utils/logUtils";
import { DEFAULT_ALERT } from "utils/constants";
import type { HotkeyContext } from "utils/enums";
import { Languages } from "utils/enums";
import type { AlertState } from "utils/types";

import { ThemeMode } from "themes/enums";

import type { PayloadAction } from "@reduxjs/toolkit";

const initialState: AppSettingsState = {
  tileSize: 1,
  themeMode: ThemeMode.Light,
  language: Languages.English,
  soundEnabled: true,
  imageSelectionColor: "#FF6DB6",
  selectedImageBorderWidth: 5,
  alertState: DEFAULT_ALERT,
  hotkeyStack: [],
  textOnScroll: false,
  showSaveProjectDialog: true,
  showClearPredictionsWarning: true,
};

export const applicationSettingsSlice = createSlice({
  name: "application",
  initialState: initialState,
  reducers: {
    resetApplicationSettingsSetings(_state: AppSettingsState) {
      return initialState;
    },

    hideAlertState(state) {
      state.alertState.visible = false;
    },

    setLanguage(state, action: PayloadAction<{ language: Languages }>) {
      state.language = action.payload.language;
    },
    setImageSelectionColor(
      state: AppSettingsState,
      action: PayloadAction<string>,
    ) {
      state.imageSelectionColor = action.payload;
    },
    setSelectedImageBorderWidth(
      state: AppSettingsState,
      action: PayloadAction<{ selectionSize: number }>,
    ) {
      state.selectedImageBorderWidth = action.payload.selectionSize;
    },
    setThemeMode(
      state: AppSettingsState,
      action: PayloadAction<{ mode: ThemeMode }>,
    ) {
      state.themeMode = action.payload.mode;
    },
    setSoundEnabled(state, action: PayloadAction<{ soundEnabled: boolean }>) {
      state.soundEnabled = action.payload.soundEnabled;
    },
    registerHotkeyContext(
      state,
      action: PayloadAction<{ context: HotkeyContext }>,
    ) {
      state.hotkeyStack.push(action.payload.context);
    },
    unregisterHotkeyContext(
      state,
      action: PayloadAction<{ context: HotkeyContext }>,
    ) {
      if (
        state.hotkeyStack[state.hotkeyStack.length - 1] ===
        action.payload.context
      ) {
        state.hotkeyStack.pop();
      } else {
        logger("Hotkey not at top of stack. Nothing popped.", { dev: true });
      }
    },
    updateAlertState(state, action: PayloadAction<{ alertState: AlertState }>) {
      state.alertState = action.payload.alertState;
      state.alertState.visible = true;
    },
    updateTileSize(
      state: AppSettingsState,
      action: PayloadAction<{ newValue: number }>,
    ) {
      state.tileSize = action.payload.newValue!;
    },
    setTextOnScroll(
      state: AppSettingsState,
      action: PayloadAction<{ textOnScroll: boolean }>,
    ) {
      state.textOnScroll = action.payload.textOnScroll;
    },
    setShowSaveProjectDialog(state, action: PayloadAction<{ show: boolean }>) {
      state.showSaveProjectDialog = action.payload.show;
    },
    setShowClearPredictionsWarning(state, action: PayloadAction<boolean>) {
      state.showClearPredictionsWarning = action.payload;
    },
  },
});
