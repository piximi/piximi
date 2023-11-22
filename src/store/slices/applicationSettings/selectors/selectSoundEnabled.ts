import { ApplicationSettings } from "types";
export const selectSoundEnabled = ({
  applicationSettings,
}: {
  applicationSettings: ApplicationSettings;
}) => {
  return applicationSettings.soundEnabled;
};
