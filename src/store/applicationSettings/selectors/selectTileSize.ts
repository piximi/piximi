import { AppSettingsState } from "store/types";

export const selectTileSize = ({
  applicationSettings,
}: {
  applicationSettings: AppSettingsState;
}): number => {
  return applicationSettings.tileSize;
};
