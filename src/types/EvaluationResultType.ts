export type EvaluationResultType = {
  confusionMatrix: number[][];
  accuracy: number;
  crossEntropy: number;
  precision: number;
  recall: number;
  f1Score: number;
};
