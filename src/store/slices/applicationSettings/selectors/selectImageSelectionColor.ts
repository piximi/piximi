import { ApplicationSettings } from "types";

export const selectImageSelectionColor = ({
  applicationSettings,
}: {
  applicationSettings: ApplicationSettings;
}): string => {
  return applicationSettings.imageSelectionColor;
};
