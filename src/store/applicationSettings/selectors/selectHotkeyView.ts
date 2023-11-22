import { HotkeyView, ApplicationSettings } from "types";

export const selectHotkeyView = ({
  applicationSettings,
}: {
  applicationSettings: ApplicationSettings;
}): HotkeyView => {
  return applicationSettings.hotkeyStack.at(-1)!;
};
