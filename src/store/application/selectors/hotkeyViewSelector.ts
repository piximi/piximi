import { HotkeyView, Settings } from "types";

export const hotkeyViewSelector = ({
  settings,
}: {
  settings: Settings;
}): HotkeyView => {
  return settings.hotkeyStack.at(-1)!;
};
