import { HistoryStateType } from "../../types/HistoryStateType";

export const annotatedSelector = ({
  state,
}: {
  state: HistoryStateType;
}): boolean => {
  return state.present.annotated;
};
