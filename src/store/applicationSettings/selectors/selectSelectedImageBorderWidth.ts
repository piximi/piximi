import { ApplicationSettings } from "types";

export const selectSelectedImageBorderWidth = ({
  applicationSettings,
}: {
  applicationSettings: ApplicationSettings;
}): number => {
  return applicationSettings.selectedImageBorderWidth;
};
