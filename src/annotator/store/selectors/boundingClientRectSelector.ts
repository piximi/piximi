import { HistoryStateType } from "../../types/HistoryStateType";

export const boundingClientRectSelector = ({
  state,
}: {
  state: HistoryStateType;
}) => {
  return state.present.boundingClientRect;
};
