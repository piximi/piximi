import { Settings } from "../../types/Settings";

export const tileSizeSelector = ({
  settings,
}: {
  settings: Settings;
}): number => {
  return settings.tileSize;
};
