import { Settings } from "../../types/Settings";

export const imageSelectionSizeSelector = ({
  settings,
}: {
  settings: Settings;
}): number => {
  return settings.imageSelectionSize;
};
