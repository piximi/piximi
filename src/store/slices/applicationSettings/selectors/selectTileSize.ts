import { ApplicationSettings } from "types";

export const selectTileSize = ({
  applicationSettings,
}: {
  applicationSettings: ApplicationSettings;
}): number => {
  return applicationSettings.tileSize;
};
