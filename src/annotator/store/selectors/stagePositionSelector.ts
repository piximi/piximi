import { HistoryStateType } from "../../types/HistoryStateType";

export const stagePositionSelector = ({
  state,
}: {
  state: HistoryStateType;
}): { x: number; y: number } => {
  return state.present.stagePosition;
};
