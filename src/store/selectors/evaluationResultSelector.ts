import { Classifier } from "../../types/Classifier";
import { ClassifierEvaluationResultType } from "types/EvaluationResultType";

export const evaluationResultSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierEvaluationResultType => {
  return classifier.evaluationResult!;
};
