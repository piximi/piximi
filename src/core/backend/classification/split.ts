import { Partition, representsUnknown } from "core/entities";

import { seededShuffle } from "utils/arrayUtils";

/* What the split needs to know about an item. */
export type LabeledItem = {
  id: string;
  categoryId: string;
  partition: Partition;
};

export type SplitOptions = {
  /* The share of labeled, unassigned items that train; the rest validate. */
  trainingPercentage: number;
  shuffle: boolean;
  seed: number;
  /*
   * A continued run keeps the existing training and validation sets and
   * trains on everything labeled since; a fresh run splits the unassigned
   * labeled items into both.
   */
  continued: boolean;
};

export type TrainingSplit = {
  training: LabeledItem[];
  validation: LabeledItem[];
  /* Unlabeled items, which the run leaves for prediction. */
  inference: LabeledItem[];
  /* The partition each item moves to; items already placed are absent. */
  assignments: Array<{ id: string; partition: Partition }>;
};

/*
 * Splits the labeled, unassigned items into training and validation per
 * category, so every category keeps the same share in each. The order is
 * the input order, or a seeded shuffle of it, so every backend assigns the
 * same items for the same seed.
 */
export const splitUnassigned = (
  unassigned: LabeledItem[],
  trainingPercentage: number,
  options: { shuffle: false } | { shuffle: true; seed: number },
): { training: LabeledItem[]; validation: LabeledItem[] } => {
  const counts = new Map<string, { total: number; count: number }>();
  for (const item of unassigned) {
    const entry = counts.get(item.categoryId) ?? { total: 0, count: 0 };
    entry.total += 1;
    counts.set(item.categoryId, entry);
  }
  const ordered = options.shuffle
    ? seededShuffle(unassigned, options.seed)
    : unassigned;
  const training: LabeledItem[] = [];
  const validation: LabeledItem[] = [];
  for (const item of ordered) {
    const entry = counts.get(item.categoryId)!;
    if (entry.count < Math.round(entry.total * trainingPercentage)) {
      training.push(item);
      entry.count += 1;
    } else {
      validation.push(item);
    }
  }
  return { training, validation };
};

/*
 * Decides what a run trains on, validates against and leaves for
 * prediction, and which partitions change as a result. Labeled items
 * sitting in the inference partition are pending predictions and take no
 * part.
 */
export const splitForTraining = (
  items: LabeledItem[],
  options: SplitOptions,
): TrainingSplit => {
  const inference: LabeledItem[] = [];
  const inTraining: LabeledItem[] = [];
  const inValidation: LabeledItem[] = [];
  const unassigned: LabeledItem[] = [];
  for (const item of items) {
    if (representsUnknown(item.categoryId)) {
      inference.push(item);
      continue;
    }
    switch (item.partition) {
      case Partition.Unassigned:
        unassigned.push(item);
        break;
      case Partition.Training:
        inTraining.push(item);
        break;
      case Partition.Validation:
        inValidation.push(item);
        break;
      default:
    }
  }

  const split = options.continued
    ? { training: unassigned, validation: [] }
    : splitUnassigned(
        unassigned,
        options.trainingPercentage,
        options.shuffle
          ? { shuffle: true, seed: options.seed }
          : { shuffle: false },
      );

  const assignments = [
    ...split.training.map((item) => ({
      id: item.id,
      partition: Partition.Training,
    })),
    ...split.validation.map((item) => ({
      id: item.id,
      partition: Partition.Validation,
    })),
    ...inference
      .filter((item) => item.partition !== Partition.Inference)
      .map((item) => ({ id: item.id, partition: Partition.Inference })),
  ];
  return {
    training: [...inTraining, ...split.training],
    validation: [...inValidation, ...split.validation],
    inference,
    assignments,
  };
};
