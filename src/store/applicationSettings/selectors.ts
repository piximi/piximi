import type { AppSettingsState } from "store/types";

import type { HotkeyContext } from "utils/enums";
import type { AlertState } from "utils/types";

import type { ThemeMode } from "themes/enums";

export const selectAlertState = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): AlertState => {
  return applicationSettings.alertState;
};

export const selectHotkeyContext = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): HotkeyContext => {
  return applicationSettings.hotkeyStack.at(-1)!;
};

export const selectImageSelectionColor = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): string => {
  return applicationSettings.imageSelectionColor;
};

export const selectLanguageType = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}) => {
  return applicationSettings.language;
};

export const selectSelectedImageBorderWidth = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): number => {
  return applicationSettings.selectedImageBorderWidth;
};

export const selectSoundEnabled = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}) => {
  return applicationSettings.soundEnabled;
};

export const selectThemeMode = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): ThemeMode => {
  return applicationSettings.themeMode;
};

export const selectTileSize = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): number => {
  return applicationSettings.tileSize;
};

export const selectTextOnScroll = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): boolean => {
  return applicationSettings.textOnScroll;
};

export const selectShowSaveProjectDialog = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}) => {
  return applicationSettings.showSaveProjectDialog;
};
export const selectShowClearPredictionsWarning = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): boolean => {
  return applicationSettings.showClearPredictionsWarning;
};
