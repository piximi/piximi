import { Settings } from "types";

export const selectImageSelectionColor = ({
  settings,
}: {
  settings: Settings;
}): string => {
  return settings.imageSelectionColor;
};
