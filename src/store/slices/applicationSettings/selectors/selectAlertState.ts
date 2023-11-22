import { AlertStateType, ApplicationSettings } from "types";

export const selectAlertState = ({
  applicationSettings,
}: {
  applicationSettings: ApplicationSettings;
}): AlertStateType => {
  return applicationSettings.alertState;
};
