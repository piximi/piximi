import { HistoryStateType } from "../../types/HistoryStateType";
import { ToolType } from "../../types/ToolType";

export const toolTypeSelector = ({
  state,
}: {
  state: HistoryStateType;
}): ToolType => {
  return state.present.toolType;
};
