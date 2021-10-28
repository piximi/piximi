import { HistoryStateType } from "../../types/HistoryStateType";

export const contrastSelector = ({
  state,
}: {
  state: HistoryStateType;
}): number => {
  return state.present.contrast;
};
