import { AppSettingsState } from "store/types";

export const selectSelectedImageBorderWidth = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): number => {
  return applicationSettings.selectedImageBorderWidth;
};
