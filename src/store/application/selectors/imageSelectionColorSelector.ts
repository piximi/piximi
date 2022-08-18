import { Settings } from "types";

export const imageSelectionColorSelector = ({
  settings,
}: {
  settings: Settings;
}): string => {
  return settings.imageSelectionColor;
};
