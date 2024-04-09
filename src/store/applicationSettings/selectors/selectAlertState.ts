import { AppSettingsState } from "store/types";
import { AlertState } from "utils/common/types";

export const selectAlertState = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): AlertState => {
  return applicationSettings.alertState;
};
