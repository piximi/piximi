export enum Partition {
  Training = "Training", // images to be used for training the model
  Validation = "Validation", // images to be used for validating a model
  Inference = "Inference", // images to be used for inference
  Unassigned = "Unassigned",
}

export type PredictionCorrection = {
  correctedFromRunId: string;
  predictedCategoryId: string;
  predictionConfidence: number;
  correctedAt: string; // ISO timestamp
};

export type Predictable = {
  partition: Partition;
  predictionConfidence?: number;
  predictedAtRunId?: string;
  predictionCorrected?: PredictionCorrection;
};
