import { Classifier, ClassifierEvaluationResultType } from "types";

export const classifierEvaluationResultSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierEvaluationResultType => {
  return classifier.evaluationResult!;
};
