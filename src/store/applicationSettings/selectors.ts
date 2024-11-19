import { HotkeyContext } from "utils/common/enums";
import { ThemeMode } from "themes/enums";

import { AlertState } from "utils/common/types";
import { AppSettingsState } from "store/types";

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

export const selectTextOnScroll = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): boolean => {
  return applicationSettings.textOnScroll;
};
