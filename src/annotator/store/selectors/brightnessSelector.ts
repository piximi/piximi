import { HistoryStateType } from "../../types/HistoryStateType";

export const brightnessSelector = ({ state }: { state: HistoryStateType }) => {
  return state.present.brightness;
};
