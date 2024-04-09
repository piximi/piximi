import { AppSettingsState } from "store/types";
import { ThemeMode } from "themes/enums";
import { HotkeyView } from "utils/common/enums";
import { AlertState } from "utils/common/types";

export const selectAlertState = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): AlertState => {
  return applicationSettings.alertState;
};

export const selectHotkeyView = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): HotkeyView => {
  return applicationSettings.hotkeyStack.at(-1)!;
};

export const selectImageSelectionColor = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): string => {
  return applicationSettings.imageSelectionColor;
};

export const selectInitSettings = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}) => {
  return applicationSettings.init;
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
