import { AppSettingsState } from "store/types";
export const selectLanguageType = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}) => {
  return applicationSettings.language;
};
