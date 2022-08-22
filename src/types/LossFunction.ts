export enum LossFunction {
  AbsoluteDifference = "Absolute difference",
  CategoricalCrossEntropy = "Categorical (softmax) cross entropy",
  /*
   * Disabled CosineDistance - see comment in
   * store/common/coroutines/compile.ts
   */
  // CosineDistance = "Cosine distance",
  Hinge = "Hinge",
  Huber = "Huber",
  Log = "Log",
  MeanSquaredError = "Mean squared error (MSE)",
  SigmoidCrossEntropy = "Sigmoid cross entropy",
}
