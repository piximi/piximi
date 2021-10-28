import { HistoryStateType } from "../../types/HistoryStateType";

export const selectedAnnotationIdSelector = ({
  state,
}: {
  state: HistoryStateType;
}): string | undefined => {
  if (!state.present.selectedAnnotation) return undefined;
  else return state.present.selectedAnnotation.id;
};
