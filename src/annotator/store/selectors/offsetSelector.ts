import { HistoryStateType } from "../../types/HistoryStateType";

export const offsetSelector = ({ state }: { state: HistoryStateType }) => {
  return state.present.offset;
};
