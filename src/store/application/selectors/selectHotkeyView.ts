import { HotkeyView, Settings } from "types";

export const selectHotkeyView = ({
  settings,
}: {
  settings: Settings;
}): HotkeyView => {
  return settings.hotkeyStack.at(-1)!;
};
