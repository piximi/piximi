import { HotkeyView, Settings } from "types";

export const hotkeyViewSelector = ({
  settings,
}: {
  settings: Settings;
}): HotkeyView => {
  return settings.hotkeyStack[settings.hotkeyStack.length - 1];
};
