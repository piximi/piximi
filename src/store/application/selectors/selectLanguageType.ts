import { Settings } from "types";
export const selectLanguageType = ({ settings }: { settings: Settings }) => {
  return settings.language;
};
