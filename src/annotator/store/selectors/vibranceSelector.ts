import { HistoryStateType } from "../../types/HistoryStateType";

export const vibranceSelector = ({ state }: { state: HistoryStateType }) => {
  return state.present.vibrance;
};
