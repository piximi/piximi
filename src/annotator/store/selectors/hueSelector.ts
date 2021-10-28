import { HistoryStateType } from "../../types/HistoryStateType";

export const hueSelector = ({ state }: { state: HistoryStateType }) => {
  return state.present.hue;
};
