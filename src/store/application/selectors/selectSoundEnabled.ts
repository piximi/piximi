import { Settings } from "types";
export const selectSoundEnabled = ({ settings }: { settings: Settings }) => {
  return settings.soundEnabled;
};
