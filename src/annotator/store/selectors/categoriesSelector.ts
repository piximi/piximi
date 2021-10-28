import { HistoryStateType } from "../../types/HistoryStateType";

export const categoriesSelector = ({ state }: { state: HistoryStateType }) => {
  return state.present.categories;
};
