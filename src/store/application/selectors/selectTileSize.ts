import { Settings } from "types";

export const selectTileSize = ({
  settings,
}: {
  settings: Settings;
}): number => {
  return settings.tileSize;
};
