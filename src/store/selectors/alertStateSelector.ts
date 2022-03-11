import { Settings } from "../../types/Settings";
import { AlertStateType } from "types/AlertStateType";

export const alertStateSelector = ({
  settings,
}: {
  settings: Settings;
}): AlertStateType => {
  return settings.alertState;
};
