import { describe, expect, it } from "vitest";

import { BBoxTracker } from "../BBoxTracker";

import type { BBoxTrackingConfig, TrackInput } from "../types";

const at = (
  id: string,
  timepoint: number,
  x: number,
  kindId = "kind",
): TrackInput => ({
  id,
  kindId,
  timepoint,
  boundingBox: [x, 10, x + 10, 20],
  center: { x: x + 5, y: 15 },
});

const track = (
  inputs: TrackInput[],
  config: Partial<BBoxTrackingConfig> = {},
  kinds?: string,
) =>
  new BBoxTracker({
    seriesId: "series",
    numFrames: Math.max(...inputs.map((input) => input.timepoint)) + 1,
    overlapThreshold: 0.5,
    getColor: () => "#123456",
    ...config,
  }).computeTracks(inputs, kinds);

// Each test is drawn as a grid: rows are timepoints and columns are the left edge
// of a box. Every box is 10 wide, so two boxes d apart in x overlap by
// (10 - d) / 10. Only the x positions in use are shown, so columns are not to
// scale. Cells hold annotation ids, "/" separates ids sharing a cell, and "."
// means nothing is there. The default overlapThreshold is 0.5.
// "t0-1" means timepoints 0 through 1.
describe("BBoxTracker", () => {
  // x:   0   5   8
  // t0   a0  .   .
  // t1   .   a1  .
  // t2   .   .   a2
  //
  // a0 -> a1 overlaps by exactly 50%, a1 -> a2 overlaps by 70%
  // Expected: a (t0-2)
  it("links boxes overlapping at or above the threshold", () => {
    const { tracks } = track([at("a0", 0, 0), at("a1", 1, 5), at("a2", 2, 8)]);

    expect(tracks).toHaveLength(1);
    expect(tracks[0].linkedIds).toEqual(["a0", "a1", "a2"]);
  });

  // x:   0   8
  // t0   a0  .
  // t1   a1  .
  // t2   .   b0
  // t3   .   b1
  //
  // a1 -> b0 overlaps by 20%
  // Expected: a (t0-1), b (t2-3)
  it("does not link boxes overlapping below the threshold", () => {
    // 20% overlap
    const { tracks } = track([
      at("a0", 0, 0),
      at("a1", 1, 0),
      at("b0", 2, 8),
      at("b1", 3, 8),
    ]);

    expect(tracks).toHaveLength(2);
    expect(tracks[0].linkedIds).toEqual(["a0", "a1"]);
    expect(tracks[1].linkedIds).toEqual(["b0", "b1"]);
  });

  // x:   0
  // t0   a0
  // t1   a1
  //
  // a0 -> a1 overlaps by 100%
  // Expected: a (t0-1), named Tracklet-1
  it("sets start, end, name and color on tracklets", () => {
    const { tracks } = track([at("a0", 0, 0), at("a1", 1, 0)]);

    expect(tracks[0]).toMatchObject({
      seriesId: "series",
      name: "Tracklet-1",
      color: "#123456",
      start: 0,
      end: 1,
    });
  });

  // x:   0     1     5
  // t0   a0    .     .
  // t1   .     more  less
  //
  // a0 -> less overlaps by 50%, a0 -> more overlaps by 90%
  // Expected: a0 + more (t0-1)
  it("links to the most overlapping candidate", () => {
    const { tracks } = track([
      at("a0", 0, 0),
      at("less", 1, 5),
      at("more", 1, 1),
    ]);

    expect(tracks[0].linkedIds).toEqual(["a0", "more"]);
  });

  // x:   0
  // t0   a0/b0
  // t1   a1/b1
  //
  // a is kindA, b is kindB. Their boxes overlap by 100%, but must not link
  // Expected: a (t0-1), b (t0-1)
  it("never links annotations of different kinds", () => {
    const { tracks } = track([
      at("a0", 0, 0, "kindA"),
      at("a1", 1, 0, "kindA"),
      at("b0", 0, 0, "kindB"),
      at("b1", 1, 0, "kindB"),
    ]);

    expect(tracks).toHaveLength(2);
    tracks.forEach(({ linkedIds }) => {
      expect(linkedIds[0][0]).toBe(linkedIds[1][0]);
    });
  });

  // x:   0   50
  // t0   a0  b0
  // t1   a1  b1
  //
  // a is kindA, b is kindB. Only kindB is requested
  // Expected: b (t0-1)
  it("only tracks the requested kind", () => {
    const { tracks } = track(
      [
        at("a0", 0, 0, "kindA"),
        at("a1", 1, 0, "kindA"),
        at("b0", 0, 50, "kindB"),
        at("b1", 1, 50, "kindB"),
      ],
      {},
      "kindB",
    );

    expect(tracks).toHaveLength(1);
    expect(tracks[0].linkedIds).toEqual(["b0", "b1"]);
  });

  // x:   0       100
  // t0   a0      lonely
  // t1   a1      .
  //
  // lonely overlaps nothing
  // Expected: a (t0-1), lonely is dropped
  it("drops single frame tracklets by default", () => {
    const { tracks } = track([
      at("a0", 0, 0),
      at("a1", 1, 0),
      at("lonely", 0, 100),
    ]);

    expect(tracks).toHaveLength(1);
    expect(tracks[0].linkedIds).toEqual(["a0", "a1"]);
  });

  // x:   0   50  100
  // t0   a0  iso  .
  // t1   a1   .  late
  //
  // late overlaps nothing
  // Expected: a (t0-1), iso (t0), late (t1)
  it("keeps single frame tracklets when asked to", () => {
    const { tracks } = track(
      [at("a0", 0, 0), at("iso", 0, 50), at("a1", 1, 0), at("late", 1, 100)],
      { includeIsolatedAnnotations: true },
    );

    expect(tracks).toHaveLength(3);
    expect(tracks.map(({ linkedIds }) => linkedIds)).toEqual(
      expect.arrayContaining([["a0", "a1"], ["iso"], ["late"]]),
    );
  });

  // x:   100
  // t0   a0
  // t1   a1
  //
  // Boxes span x=100-110 and y=10-20
  // Expected: coms.a0 is at x=105, y=15
  it("reports absolute centers", () => {
    const { coms } = track([at("a0", 0, 100), at("a1", 1, 100)]);

    expect(coms.a0).toEqual({ annotationId: "a0", x: 105, y: 15 });
  });
});
