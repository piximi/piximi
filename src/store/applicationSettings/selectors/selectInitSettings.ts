import { AppSettingsState } from "store/types";

export const selectInitSettings = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}) => {
  return applicationSettings.init;
};
