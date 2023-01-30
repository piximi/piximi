import { Settings } from "types";

export const initSelector = ({ settings }: { settings: Settings }) => {
  return settings.init;
};
