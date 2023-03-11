import { Settings } from "types";

export const selectedImageBorderWidthSelector = ({
  settings,
}: {
  settings: Settings;
}): number => {
  return settings.selectedImageBorderWidth;
};
