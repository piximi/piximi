import { describe, expect, it } from "vitest";

import {
  calculateCenterOfMass,
  calculateDistance,
  createOrderedTrackInputs,
  findNearestNeighbors,
  findOverlappingBoxes,
  groupByTimepoint,
} from "../geometry";

import type { CenterOfMass, TrackInput } from "../types";

const com = (annotationId: string, x: number, y = 0): CenterOfMass => ({
  annotationId,
  x,
  y,
});

const input = (id: string, timepoint: number): TrackInput => ({
  id,
  kindId: "kind",
  timepoint,
  boundingBox: [0, 0, 1, 1],
  center: { x: 0, y: 0 },
});

describe("calculateCenterOfMass", () => {
  it("averages the coordinates of non-zero pixels", () => {
    const mask = new Uint8Array([0, 1, 0, 0, 1, 1]);

    expect(calculateCenterOfMass(mask, 3)).toEqual({
      x: 4 / 3,
      y: 2 / 3,
      mass: 3,
    });
  });

  it("returns zero mass for an empty mask", () => {
    expect(calculateCenterOfMass(new Uint8Array(4), 2).mass).toBe(0);
  });
});

describe("calculateDistance", () => {
  it("returns the euclidean distance", () => {
    expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("findNearestNeighbors", () => {
  it("includes targets beyond 50px when maxDistance allows it", () => {
    const result = findNearestNeighbors(com("s", 0), [com("t", 80)], 100);

    expect(result?.targetId).toEqual(["t"]);
  });

  it("excludes targets beyond maxDistance", () => {
    const result = findNearestNeighbors(
      com("s", 0),
      [com("near", 5), com("far", 20)],
      10,
    );

    expect(result?.targetId).toEqual(["near"]);
  });

  it("returns undefined when nothing is in range", () => {
    expect(findNearestNeighbors(com("s", 0), [com("t", 20)], 10)).toBe(
      undefined,
    );
  });

  it("reports the true minimum distance and orders targets nearest first", () => {
    const result = findNearestNeighbors(
      com("s", 0),
      [com("far", 9), com("near", 2), com("mid", 5)],
      10,
    );

    expect(result?.distance).toBe(2);
    expect(result?.targetId).toEqual(["near", "mid", "far"]);
  });

  it("has no limit when maxDistance is undefined", () => {
    const result = findNearestNeighbors(com("s", 0), [com("t", 5000)]);

    expect(result?.targetId).toEqual(["t"]);
  });
});

describe("findOverlappingBoxes", () => {
  it("reports the fraction of the target box that is overlapped", () => {
    const result = findOverlappingBoxes(
      [0, 0, 10, 10],
      [
        { id: "half", boundingBox: [5, 0, 15, 10] },
        { id: "none", boundingBox: [20, 20, 30, 30] },
      ],
    );

    expect(result).toEqual([{ id: "half", overlap: 0.5 }]);
  });
});

describe("groupByTimepoint", () => {
  it("keeps annotations at timepoint 0", () => {
    const grouped = groupByTimepoint([input("a", 0), input("b", 2)]);

    expect(grouped.get(0)?.map(({ id }) => id)).toEqual(["a"]);
    expect(grouped.get(2)?.map(({ id }) => id)).toEqual(["b"]);
  });
});

describe("createOrderedTrackInputs", () => {
  it("indexes inputs by timepoint", () => {
    const { ordered, warnings } = createOrderedTrackInputs(
      { a: input("a", 1) },
      2,
    );

    expect(Object.keys(ordered[0])).toEqual([]);
    expect(Object.keys(ordered[1])).toEqual(["a"]);
    expect(warnings).toEqual([]);
  });

  it("skips and warns about out of range timepoints", () => {
    const { ordered, warnings } = createOrderedTrackInputs(
      { a: input("a", 5) },
      2,
    );

    expect(ordered.flatMap((frame) => Object.keys(frame))).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("a");
  });
});
