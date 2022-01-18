import { Settings } from "../../types/Settings";
import { ThemeMode } from "types/ThemeMode";

export const themeModeSelector = ({
  settings,
}: {
  settings: Settings;
}): ThemeMode => {
  return settings.themeMode;
};
