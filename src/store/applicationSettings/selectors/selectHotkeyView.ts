import { AppSettingsState } from "store/types";
import { HotkeyView } from "utils/common/enums";

export const selectHotkeyView = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): HotkeyView => {
  return applicationSettings.hotkeyStack.at(-1)!;
};
