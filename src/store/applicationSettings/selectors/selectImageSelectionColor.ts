import { AppSettingsState } from "store/types";

export const selectImageSelectionColor = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): string => {
  return applicationSettings.imageSelectionColor;
};
