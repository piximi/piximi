import { describe, expect, it } from "vitest";

import { Partition } from "core/dl/enums";

import {
  concatTables,
  dimensionsOf,
  plotDataOf,
  scopeOf,
  selectedColumns,
  tableRows,
} from "./measurementTable";

import type { ChannelMeta } from "core/entities";
import type { MeasurementTable } from "core/backend";

import type { ImageMeasurementGroup, ObjectMeasurementGroup } from "./types";

const meta = (id: string, name: string): ChannelMeta => ({
  id,
  name,
  bitDepth: 8,
  colorMap: [1, 0, 0],
  visible: true,
  minValue: 0,
  maxValue: 255,
  rampMin: 0,
  rampMax: 255,
  rampMinLimit: 0,
  rampMaxLimit: 255,
});

const base = {
  id: "g",
  name: "Cells",
  splits: {},
  plots: {},
  selectedPlotId: undefined,
};

const objectGroup: ObjectMeasurementGroup = {
  ...base,
  kind: "cell",
  featureMeasurements: ["area", "perimeter"],
  // The tree stores its parent nodes alongside the leaves.
  intensityMeasurements: ["intensity", "mean", "mean-DAPI", "std-Gone"],
};

const imageGroup: ImageMeasurementGroup = {
  ...base,
  featureMeasurements: ["entropy"],
  intensityMeasurements: ["median-DAPI"],
};

const metas = [meta("m0", "DAPI"), meta("m1", "GFP")];

describe("selectedColumns", () => {
  it("maps features and channel labels to backend column keys", () => {
    expect(selectedColumns(objectGroup, metas)).toEqual([
      { label: "area", key: "feature:area" },
      { label: "perimeter", key: "feature:perimeter" },
      { label: "mean-DAPI", key: "intensity:mean:m0" },
    ]);
  });

  it("leaves out channel features and labels naming no meta", () => {
    expect(selectedColumns(imageGroup, metas)).toEqual([
      { label: "median-DAPI", key: "intensity:median:m0" },
    ]);
    expect(selectedColumns(imageGroup, [])).toEqual([]);
  });

  it("names the scope by the group's kind", () => {
    expect(scopeOf(objectGroup)).toEqual({ type: "objects", kindId: "cell" });
    expect(scopeOf(imageGroup)).toEqual({ type: "images" });
  });
});

const page = (
  ids: string[],
  values: Record<string, (number | null)[]>,
  total: number,
): MeasurementTable => ({
  ids,
  imageIds: ids.map((id) => `im-${id}`),
  imageNames: ids.map((id) => `image ${id}`),
  categoryIds: ids.map((id) => (id === "b" ? "cat-2" : "cat-1")),
  partitions: ids.map(() => Partition.Unassigned),
  timepoints: ids.map(() => 0),
  boundingBoxes: ids.map(() => [0, 0, 1, 1]),
  values,
  total,
});

describe("tables", () => {
  const whole = concatTables([
    page(["a", "b"], { "feature:area": [1, 2] }, 3),
    page(["c"], { "feature:area": [null] }, 3),
  ]);
  const scope = { type: "objects" as const, kindId: "cell" };
  const categories = { "cat-1": { name: "One" }, "cat-2": { name: "Two" } };
  const rows = tableRows(whole, scope, categories as never);

  it("concatenates pages column by column", () => {
    expect(whole.ids).toEqual(["a", "b", "c"]);
    expect(whole.values["feature:area"]).toEqual([1, 2, null]);
    expect(whole.imageIds).toEqual(["im-a", "im-b", "im-c"]);
    expect(whole.boundingBoxes).toHaveLength(3);
    expect(whole.total).toBe(3);
  });

  it("turns the columns into rows that know their position", () => {
    expect(rows[1]).toEqual({
      id: "b",
      index: 1,
      name: "image b_1",
      categoryId: "cat-2",
      categoryName: "Two",
      partition: Partition.Unassigned,
      imageId: "im-b",
      imageName: "image b",
      timepoint: 0,
      boundingBox: [0, 0, 1, 1],
    });
    const images = tableRows(
      { ...whole, imageIds: undefined, boundingBoxes: undefined },
      { type: "images" },
      categories as never,
    );
    expect(images[0]).toMatchObject({ name: "image a", imageId: "a" });
    expect(images[0].boundingBox).toBeUndefined();
  });

  it("keeps only answered values in the plot data", () => {
    const data = plotDataOf(
      rows,
      [{ label: "area", key: "feature:area" }],
      whole,
      scope,
    );
    expect(data.a).toMatchObject({
      kind: "cell",
      category: "One",
      measurements: { area: 1 },
    });
    expect(data.c.measurements).toEqual({});
  });

  it("offers the rows' splits", () => {
    const dims = dimensionsOf(rows, scope);
    expect(dims.map((d) => d.id)).toEqual(["category", "partition", "image"]);
    expect(dims[0].values.map((v) => v.label)).toEqual(["One", "Two"]);
    expect(dims[2].values).toHaveLength(3);
    const imageDims = dimensionsOf(rows, { type: "images" });
    expect(imageDims.map((d) => d.id)).toEqual([
      "category",
      "partition",
      "timepoint",
    ]);
  });
});
