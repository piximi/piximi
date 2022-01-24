import { Classifier } from "../../types/Classifier";
import { EvaluationResultType } from "types/EvaluationResultType";

export const evaluationResultSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): EvaluationResultType => {
  return classifier.evaluationResult!;
};
