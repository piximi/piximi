import { Classifier, ClassifierEvaluationResultType } from "types";

export const selectClassifierEvaluationResult = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierEvaluationResultType => {
  return classifier.evaluationResult!;
};
