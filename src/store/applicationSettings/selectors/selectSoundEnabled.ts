import { AppSettingsState } from "store/types";
export const selectSoundEnabled = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}) => {
  return applicationSettings.soundEnabled;
};
