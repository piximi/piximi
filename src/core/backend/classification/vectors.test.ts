import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { Partition, nextPartition, predictionCorrection } from "core/entities";

import { seededShuffle } from "utils/arrayUtils";
import { mulberry32 } from "utils/numberUtils";

import { fingerprintItems, hashCategorySet } from "./fingerprint";
import { splitForTraining } from "./split";

import type { PredictionCorrection } from "core/entities";

import type { LabeledItem, SplitOptions } from "./split";

/*
 * The engine implements the same rules in Python (tests/test_classification
 * _vectors.py): the seeded shuffle, the training split, dataset fingerprints
 * and the partition and correction rules. This file holds the inputs, and
 * `classification.json` next to the other shared vectors holds what both
 * must produce. Regenerate it from here with PIXIMI_WRITE_VECTORS=1 after a
 * deliberate change.
 */
const VECTORS = path.resolve(
  __dirname,
  "../../../../python/packages/piximi-engine/tests/vectors/classification.json",
);

const KNOWN = (n: number) => `1${n}-cat`;
const UNKNOWN = "0-unknown";

const labeled = (
  id: string,
  categoryId: string,
  partition: Partition = Partition.Unassigned,
): LabeledItem => ({ id, categoryId, partition });

const TEN = "abcdefghij".split("").map((c) => `item-${c}`);

const splitItems: LabeledItem[] = [
  labeled("i1", KNOWN(1)),
  labeled("i2", KNOWN(1)),
  labeled("i3", KNOWN(1)),
  labeled("i4", KNOWN(1)),
  labeled("i5", KNOWN(1)),
  labeled("i6", KNOWN(2)),
  labeled("i7", KNOWN(2)),
  labeled("i8", KNOWN(2)),
  labeled("i9", KNOWN(3)),
  labeled("i10", UNKNOWN),
  labeled("i11", UNKNOWN, Partition.Inference),
  labeled("i12", KNOWN(1), Partition.Training),
  labeled("i13", KNOWN(2), Partition.Validation),
  // A pending prediction: labeled but still in inference, so left alone.
  labeled("i14", KNOWN(3), Partition.Inference),
];

const inputs = {
  mulberry32: [0, 1, 7, 42, 123456789, -5, 2147483648].map((seed) => ({
    seed,
    count: 8,
  })),
  shuffle: [
    { seed: 7, items: TEN },
    { seed: 0, items: Array.from({ length: 25 }, (_, i) => `n${i}`) },
    { seed: 99, items: [] as string[] },
    { seed: 3, items: ["only"] },
    { seed: -1, items: TEN.slice(0, 4) },
  ],
  split: [
    {
      name: "fresh, shuffled",
      items: splitItems,
      options: {
        trainingPercentage: 0.8,
        shuffle: true,
        seed: 11,
        continued: false,
      },
    },
    {
      name: "fresh, in order",
      items: splitItems,
      options: {
        trainingPercentage: 0.5,
        shuffle: false,
        seed: 0,
        continued: false,
      },
    },
    {
      name: "continued",
      items: splitItems,
      options: {
        trainingPercentage: 0.8,
        shuffle: true,
        seed: 11,
        continued: true,
      },
    },
    {
      name: "nothing unassigned",
      items: splitItems.filter((it) => it.partition !== Partition.Unassigned),
      options: {
        trainingPercentage: 0.8,
        shuffle: true,
        seed: 5,
        continued: false,
      },
    },
    {
      name: "single item per category",
      items: [labeled("s1", KNOWN(1)), labeled("s2", KNOWN(2))],
      options: {
        trainingPercentage: 0.8,
        shuffle: true,
        seed: 1,
        continued: false,
      },
    },
  ] satisfies Array<{
    name: string;
    items: LabeledItem[];
    options: SplitOptions;
  }>,
  fingerprint: [
    { items: [] as Array<{ id: string; categoryId: string }> },
    {
      items: [
        { id: "b", categoryId: KNOWN(2) },
        { id: "a", categoryId: KNOWN(1) },
      ],
    },
    {
      items: [
        { id: "a", categoryId: KNOWN(1) },
        { id: "b", categoryId: KNOWN(2) },
      ],
    },
    {
      items: [
        { id: "a", categoryId: KNOWN(2) },
        { id: "b", categoryId: KNOWN(1) },
      ],
    },
  ],
  categorySetHash: [{ ids: [] as string[] }, { ids: [KNOWN(2), KNOWN(1)] }],
  partition: [KNOWN(1), UNKNOWN].flatMap((categoryId) =>
    Object.values(Partition).flatMap((current) =>
      [false, true].map((predicted) => ({ categoryId, current, predicted })),
    ),
  ),
  correction: [
    {
      name: "a corrected prediction",
      existing: KNOWN(1),
      next: KNOWN(2),
      prediction: { predictedAtRunId: "run-1", predictionConfidence: 0.9 },
      existingCorrection: null as PredictionCorrection | null,
      correctedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      name: "back to unknown",
      existing: KNOWN(1),
      next: UNKNOWN,
      prediction: { predictedAtRunId: "run-1", predictionConfidence: 0.9 },
      existingCorrection: {
        correctedFromRunId: "run-0",
        predictedCategoryId: KNOWN(3),
        predictionConfidence: 0.4,
        correctedAt: "2025-12-31T00:00:00.000Z",
      } as PredictionCorrection | null,
      correctedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      name: "same category keeps the old correction",
      existing: KNOWN(1),
      next: KNOWN(1),
      prediction: { predictedAtRunId: "run-1", predictionConfidence: 0.9 },
      existingCorrection: {
        correctedFromRunId: "run-0",
        predictedCategoryId: KNOWN(3),
        predictionConfidence: 0.4,
        correctedAt: "2025-12-31T00:00:00.000Z",
      } as PredictionCorrection | null,
      correctedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      name: "no prediction to correct",
      existing: KNOWN(1),
      next: KNOWN(2),
      prediction: {
        predictedAtRunId: undefined,
        predictionConfidence: undefined,
      },
      existingCorrection: null as PredictionCorrection | null,
      correctedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

type Vectors = {
  mulberry32: Array<{ seed: number; count: number; expect: number[] }>;
  shuffle: Array<{ seed: number; items: string[]; expect: string[] }>;
  split: Array<{
    name: string;
    items: LabeledItem[];
    options: SplitOptions;
    expect: {
      training: string[];
      validation: string[];
      inference: string[];
      assignments: Array<{ id: string; partition: Partition }>;
    };
  }>;
  fingerprint: Array<{
    items: Array<{ id: string; categoryId: string }>;
    expect: string;
  }>;
  categorySetHash: Array<{ ids: string[]; expect: string }>;
  partition: Array<{
    categoryId: string;
    current: Partition;
    predicted: boolean;
    expect: Partition;
  }>;
  correction: Array<{
    name: string;
    existing: string;
    next: string;
    prediction: {
      predictedAtRunId?: string;
      predictionConfidence?: number;
    };
    existingCorrection: PredictionCorrection | null;
    correctedAt: string;
    expect: PredictionCorrection | null;
  }>;
};

const compute = async (): Promise<Vectors> => ({
  mulberry32: inputs.mulberry32.map(({ seed, count }) => {
    const rng = mulberry32(seed);
    return { seed, count, expect: Array.from({ length: count }, rng) };
  }),
  shuffle: inputs.shuffle.map((c) => ({
    ...c,
    expect: seededShuffle(c.items, c.seed),
  })),
  split: inputs.split.map((c) => {
    const result = splitForTraining(c.items, c.options);
    return {
      ...c,
      expect: {
        training: result.training.map((it) => it.id),
        validation: result.validation.map((it) => it.id),
        inference: result.inference.map((it) => it.id),
        assignments: result.assignments,
      },
    };
  }),
  fingerprint: await Promise.all(
    inputs.fingerprint.map(async (c) => ({
      ...c,
      expect: await fingerprintItems(c.items),
    })),
  ),
  categorySetHash: await Promise.all(
    inputs.categorySetHash.map(async (c) => ({
      ...c,
      expect: await hashCategorySet(c.ids),
    })),
  ),
  partition: inputs.partition.map((c) => ({
    ...c,
    expect: nextPartition(c.categoryId, c.current, c.predicted),
  })),
  correction: inputs.correction.map((c) => ({
    ...c,
    expect:
      predictionCorrection(
        c.existing,
        c.next,
        c.prediction,
        c.existingCorrection ?? undefined,
        c.correctedAt,
      ) ?? null,
  })),
});

describe("classification (shared vectors)", () => {
  it("produces what classification.json records", async () => {
    const computed = await compute();
    if (process.env.PIXIMI_WRITE_VECTORS) {
      writeFileSync(VECTORS, JSON.stringify(computed, null, 2) + "\n");
    }
    const stored = JSON.parse(readFileSync(VECTORS, "utf8")) as Vectors;
    expect(computed).toEqual(stored);
  });

  it("recomputes every stored case from its own inputs", async () => {
    const stored = JSON.parse(readFileSync(VECTORS, "utf8")) as Vectors;
    for (const c of stored.shuffle) {
      expect(seededShuffle(c.items, c.seed)).toEqual(c.expect);
    }
    for (const c of stored.split) {
      const result = splitForTraining(c.items, c.options);
      expect(result.training.map((it) => it.id)).toEqual(c.expect.training);
      expect(result.validation.map((it) => it.id)).toEqual(c.expect.validation);
      expect(result.assignments).toEqual(c.expect.assignments);
    }
    for (const c of stored.fingerprint) {
      expect(await fingerprintItems(c.items)).toBe(c.expect);
    }
    for (const c of stored.partition) {
      expect(nextPartition(c.categoryId, c.current, c.predicted)).toBe(
        c.expect,
      );
    }
  });

  it("splits every category by the same share", () => {
    const result = splitForTraining(splitItems, {
      trainingPercentage: 0.8,
      shuffle: true,
      seed: 11,
      continued: false,
    });
    // Category 1 has five unassigned items: four train, one validates.
    const ofCategory = (items: LabeledItem[], categoryId: string) =>
      items.filter(
        (it) =>
          it.categoryId === categoryId && it.partition === Partition.Unassigned,
      );
    expect(ofCategory(result.training, KNOWN(1))).toHaveLength(4);
    expect(ofCategory(result.validation, KNOWN(1))).toHaveLength(1);
    // The pending prediction and the already placed items are not reassigned.
    expect(result.assignments.map((a) => a.id)).not.toContain("i14");
    expect(result.assignments.map((a) => a.id)).not.toContain("i12");
    expect(result.assignments.map((a) => a.id)).not.toContain("i11");
    expect(result.assignments).toContainEqual({
      id: "i10",
      partition: Partition.Inference,
    });
  });
});
