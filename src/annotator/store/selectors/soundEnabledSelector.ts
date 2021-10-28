import { HistoryStateType } from "../../types/HistoryStateType";

export const soundEnabledSelector = ({
  state,
}: {
  state: HistoryStateType;
}) => {
  return state.present.soundEnabled;
};
