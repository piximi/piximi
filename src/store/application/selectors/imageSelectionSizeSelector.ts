import { Settings } from "types";

export const imageSelectionSizeSelector = ({
  settings,
}: {
  settings: Settings;
}): number => {
  return settings.imageSelectionSize;
};
