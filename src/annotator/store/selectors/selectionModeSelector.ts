import { HistoryStateType } from "../../types/HistoryStateType";
import { AnnotationModeType } from "../../types/AnnotationModeType";

export const selectionModeSelector = ({
  state,
}: {
  state: HistoryStateType;
}): AnnotationModeType => {
  return state.present.selectionMode;
};
