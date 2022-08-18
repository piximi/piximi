import { AlertStateType, Settings } from "types";

export const alertStateSelector = ({
  settings,
}: {
  settings: Settings;
}): AlertStateType => {
  return settings.alertState;
};
