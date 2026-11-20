import { representsUnknown } from "./identity";

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

/*
 * The partition an item lands in when its category changes. A prediction
 * leaves the partition alone (the item stays in inference until accepted);
 * a hand-made change to unknown sends it to inference, and one to a known
 * category keeps a training or validation assignment and otherwise
 * unassigns. Every backend applies this rule, so it is checked against
 * shared vectors.
 */
export const nextPartition = (
  categoryId: string,
  current: Partition,
  predicted: boolean,
): Partition => {
  if (predicted) return current;
  if (representsUnknown(categoryId)) return Partition.Inference;
  switch (current) {
    case Partition.Training:
    case Partition.Validation:
      return current;
    default:
      return Partition.Unassigned;
  }
};

/*
 * What a hand-made category change records about the prediction it
 * overrides: a correction when a predicted item moves to another known
 * category, nothing when it returns to unknown, and otherwise whatever was
 * recorded before.
 */
export const predictionCorrection = (
  existingCategoryId: string,
  newCategoryId: string,
  prediction: {
    predictedAtRunId: string | undefined;
    predictionConfidence: number | undefined;
  },
  existingCorrection: PredictionCorrection | undefined,
  correctedAt: string = new Date().toISOString(),
): PredictionCorrection | undefined => {
  const becomingUnknown = representsUnknown(newCategoryId);
  const isCorrection =
    !!prediction.predictedAtRunId &&
    !becomingUnknown &&
    newCategoryId !== existingCategoryId;
  if (isCorrection) {
    return {
      correctedFromRunId: prediction.predictedAtRunId!,
      predictedCategoryId: existingCategoryId,
      // Set together with `predictedAtRunId`, so both exist or neither.
      predictionConfidence: prediction.predictionConfidence!,
      correctedAt,
    };
  }
  return becomingUnknown ? undefined : existingCorrection;
};
