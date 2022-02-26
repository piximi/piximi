import { Settings } from "../../types/Settings";

export const imageSelectionColorSelector = ({
  settings,
}: {
  settings: Settings;
}): string => {
  return settings.imageSelectionColor;
};
