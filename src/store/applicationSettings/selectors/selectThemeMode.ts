import { ApplicationSettings, ThemeMode } from "types";

export const selectThemeMode = ({
  applicationSettings,
}: {
  applicationSettings: ApplicationSettings;
}): ThemeMode => {
  return applicationSettings.themeMode;
};
