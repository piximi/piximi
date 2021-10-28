import { HistoryStateType } from "../../types/HistoryStateType";
import { AnnotationType } from "../../types/AnnotationType";

export const selectedAnnotationsIdsSelector = ({
  state,
}: {
  state: HistoryStateType;
}): Array<string> => {
  return state.present.selectedAnnotations.map((annotation: AnnotationType) => {
    return annotation.id;
  });
};
