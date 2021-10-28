import { HistoryStateType } from "../../types/HistoryStateType";

export const saturationSelector = ({ state }: { state: HistoryStateType }) => {
  return state.present.saturation;
};
