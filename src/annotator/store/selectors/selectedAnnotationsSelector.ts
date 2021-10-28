import { HistoryStateType } from "../../types/HistoryStateType";
import { AnnotationType } from "../../types/AnnotationType";

export const selectedAnnotationsSelector = ({
  state,
}: {
  state: HistoryStateType;
}): Array<AnnotationType> => {
  return state.present.selectedAnnotations;
};
