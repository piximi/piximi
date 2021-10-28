import { HistoryStateType } from "../../types/HistoryStateType";

export const currentIndexSelector = ({
  state,
}: {
  state: HistoryStateType;
}) => {
  return state.present.currentIndex;
};
