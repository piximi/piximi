import { HistoryStateType } from "../../types/HistoryStateType";

export const penSelectionBrushSizeSelector = ({
  state,
}: {
  state: HistoryStateType;
}) => {
  return state.present.penSelectionBrushSize;
};
