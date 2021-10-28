import { HistoryStateType } from "../../types/HistoryStateType";

export const quickSelectionBrushSizeSelector = ({
  state,
}: {
  state: HistoryStateType;
}) => {
  return state.present.quickSelectionBrushSize;
};
