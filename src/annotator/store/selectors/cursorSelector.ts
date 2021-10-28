import { HistoryStateType } from "../../types/HistoryStateType";

export const cursorSelector = ({
  state,
}: {
  state: HistoryStateType;
}): string => {
  return state.present.cursor;
};
