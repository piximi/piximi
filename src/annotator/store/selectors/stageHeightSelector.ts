import { HistoryStateType } from "../../types/HistoryStateType";

export const stageHeightSelector = ({
  state,
}: {
  state: HistoryStateType;
}): number => {
  return state.present.stageHeight;
};
