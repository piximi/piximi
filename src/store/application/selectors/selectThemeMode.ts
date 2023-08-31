import { Settings, ThemeMode } from "types";

export const selectThemeMode = ({
  settings,
}: {
  settings: Settings;
}): ThemeMode => {
  return settings.themeMode;
};
