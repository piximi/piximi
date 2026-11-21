import { describe, expect, it } from "vitest";

import { Partition } from "core/dl/enums";

import { generatePivotRows, generateUniqueCompositeKeys } from "./pivotUtils";

import type { MeasurementRow, PivotItem } from "@MeasurementViewer/types";

const row = (
  index: number,
  categoryName: string,
  partition: Partition,
): MeasurementRow => ({
  id: `r${index}`,
  index,
  name: `r${index}`,
  categoryId: categoryName,
  categoryName,
  partition,
  imageId: "im",
  imageName: "im",
  timepoint: 0,
});

const rows = [
  row(0, "Cell", Partition.Training),
  row(1, "Cell", Partition.Validation),
  row(2, "Nucleus", Partition.Training),
  row(3, "Nucleus", Partition.Training),
];
const area = [10, 20, 30, null];
const getters = [
  { key: "feature:area", label: "area", getValue: (i: number) => area[i] },
];
const category: PivotItem = {
  id: "category",
  label: "Category",
  isMainDimension: true,
};
const training: PivotItem = {
  id: Partition.Training,
  label: Partition.Training,
  parentId: "partition",
  isMainDimension: false,
};

describe("pivot rows", () => {
  it("aggregates everything without a pivot", () => {
    expect(generateUniqueCompositeKeys(rows, [])).toEqual(["all"]);
    const [line] = generatePivotRows(rows, [], getters);
    expect(line).toMatchObject({
      measurement: "area",
      all_count: 3,
      all_mean: 20,
    });
  });

  it("buckets by a dimension and a specific value, skipping missing values", () => {
    const cell = `Cell|${Partition.Training}`;
    const nucleus = `Nucleus|${Partition.Training}`;
    expect(generateUniqueCompositeKeys(rows, [category, training])).toEqual([
      cell,
      nucleus,
    ]);
    const [line] = generatePivotRows(rows, [category, training], getters);
    expect(line[`${cell}_count`]).toBe(1);
    expect(line[`${cell}_mean`]).toBe(10);
    // The null value is left out of the bucket, not counted as zero.
    expect(line[`${nucleus}_count`]).toBe(1);
    expect(line[`${nucleus}_mean`]).toBe(30);
  });
});
