import { ApplicationSettings } from "types";

export const selectInitSettings = ({
  applicationSettings,
}: {
  applicationSettings: ApplicationSettings;
}) => {
  return applicationSettings.init;
};
