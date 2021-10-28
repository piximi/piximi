import { HistoryStateType } from "../../types/HistoryStateType";

export const languageSelector = ({ state }: { state: HistoryStateType }) => {
  return state.present.language;
};
