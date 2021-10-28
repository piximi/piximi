import { HistoryStateType } from "../../types/HistoryStateType";

export const invertModeSelector = ({
  state,
}: {
  state: HistoryStateType;
}): boolean => {
  return state.present.invertMode;
};
