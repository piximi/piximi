import { Classifier, ClassifierEvaluationResultType } from "types";

export const evaluationResultSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierEvaluationResultType => {
  return classifier.evaluationResult!;
};
