import { AlertStateType, Settings } from "types";

export const selectAlertState = ({
  settings,
}: {
  settings: Settings;
}): AlertStateType => {
  return settings.alertState;
};
