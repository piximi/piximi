import { ClassifierState } from "store/types";
import { ClassifierEvaluationResultType } from "utils/models/types";

export const selectClassifierEvaluationResult = ({
  classifier,
}: {
  classifier: ClassifierState;
}): ClassifierEvaluationResultType => {
  return classifier.evaluationResult!;
};
