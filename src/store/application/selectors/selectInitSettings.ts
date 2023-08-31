import { Settings } from "types";

export const selectInitSettings = ({ settings }: { settings: Settings }) => {
  return settings.init;
};
