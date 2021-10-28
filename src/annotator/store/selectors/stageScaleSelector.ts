import { HistoryStateType } from "../../types/HistoryStateType";

export const stageScaleSelector = ({
  state,
}: {
  state: HistoryStateType;
}): number => {
  return state.present.stageScale;
};
