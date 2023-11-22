import { ApplicationSettings } from "types";
export const selectLanguageType = ({
  applicationSettings,
}: {
  applicationSettings: ApplicationSettings;
}) => {
  return applicationSettings.language;
};
