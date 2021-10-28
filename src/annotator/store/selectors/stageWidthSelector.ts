import { HistoryStateType } from "../../types/HistoryStateType";

export const stageWidthSelector = ({
  state,
}: {
  state: HistoryStateType;
}): number => {
  return state.present.stageWidth;
};
