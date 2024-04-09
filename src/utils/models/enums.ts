export enum CropSchema {
  None = "None", // do not crop
  // Smallest = "Smallest", // crop to match smallest square in training dataset
  // Biggest = "Biggest", // crop the biggest square possible per sample
  Match = "Match", // match crop size to architecture input shape
}

export enum ModelTask {
  Classification,
  Segmentation,
}

export enum ModelStatus {
  Uninitialized,
  InitFit,
  Loading,
  Training,
  Trained,
  Predicting,
  Suggesting,
  Evaluating,
}

export enum OptimizationAlgorithm {
  Adadelta = "Adadelta",
  Adagrad = "Adagrad",
  Adam = "Adam",
  Adamax = "Adamax",
  Momentum = "Momentum",
  RMSProp = "RMSProp",
  StochasticGradientDescent = "Stochastic gradient descent (SGD)",
}

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

export enum Metric {
  BinaryAccuracy = "Binary accuracy",
  BinaryCrossEntropy = "Binary cros-sentropy",
  CategoricalAccuracy = "Categorical accuracy",
  CategoricalCrossEntropy = "Categorical cross-entropy",
  CosineProximity = "Cosine proximity",
  MeanAbsoluteError = "Mean absolute error (MAE)",
  MeanAbsolutePercentageError = "Mean absolute percentage error",
  MeanSquaredError = "Mean squared error",
  Precision = "Precision",
  Recall = "Recall",
  SparseCategoricalAccuracy = "Sparse categorical accuracy",
}

export enum Partition {
  Training = "Training", // images to be used for training the model
  Validation = "Validation", // images to be used for validating a model
  Inference = "Inference", // images to be used for inference
  Unassigned = "Unassigned",
}
