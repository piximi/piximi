export type ClassifierEvaluationResultType = {
  confusionMatrix: number[][];
  accuracy: number;
  crossEntropy: number;
  precision: number;
  recall: number;
  f1Score: number;
};

export type SegmenterEvaluationResultType = {
  pixelAccuracy: number;
  IoUScore: number;
  diceScore: number;
};
