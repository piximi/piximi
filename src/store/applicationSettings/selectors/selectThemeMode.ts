import { ThemeMode } from "themes/enums";
import { AppSettingsState } from "store/types";

export const selectThemeMode = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): ThemeMode => {
  return applicationSettings.themeMode;
};
