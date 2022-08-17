import { Settings } from "types";

export const tileSizeSelector = ({
  settings,
}: {
  settings: Settings;
}): number => {
  return settings.tileSize;
};
