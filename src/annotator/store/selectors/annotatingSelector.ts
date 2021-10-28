import { HistoryStateType } from "../../types/HistoryStateType";

export const annotatingSelector = ({
  state,
}: {
  state: HistoryStateType;
}): boolean => {
  return state.present.annotating;
};
