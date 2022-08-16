import { Settings, ThemeMode } from "types";

export const themeModeSelector = ({
  settings,
}: {
  settings: Settings;
}): ThemeMode => {
  return settings.themeMode;
};
