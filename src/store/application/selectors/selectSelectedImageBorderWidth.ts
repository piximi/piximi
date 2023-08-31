import { Settings } from "types";

export const selectSelectedImageBorderWidth = ({
  settings,
}: {
  settings: Settings;
}): number => {
  return settings.selectedImageBorderWidth;
};
