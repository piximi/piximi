import { HistoryStateType } from "../../types/HistoryStateType";
import { AnnotationType } from "../../types/AnnotationType";

export const selectedAnnotationSelector = ({
  state,
}: {
  state: HistoryStateType;
}): AnnotationType | undefined => {
  return state.present.selectedAnnotation;
};
