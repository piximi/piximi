import { describe, expect, it } from "vitest";

import { CenterOfMassTracker } from "../CenterOfMassTracker";

import type {
  ComputedTracklet,
  CenterOfMassTrackingConfig,
  TrackInput,
} from "../types";

const at = (
  id: string,
  timepoint: number,
  x: number,
  kindId = "kind",
  y = 0,
): TrackInput => ({
  id,
  kindId,
  timepoint,
  boundingBox: [x, y, x + 1, y + 1],
  center: { x, y },
});

const track = (
  inputs: TrackInput[],
  config: Partial<CenterOfMassTrackingConfig> = {},
  kinds = "All",
) =>
  new CenterOfMassTracker({
    seriesId: "series",
    numFrames: Math.max(...inputs.map((input) => input.timepoint)) + 1,
    maxDistance: 8,
    getColor: () => "#123456",
    ...config,
  }).computeTracks(inputs, kinds);

const containing = (tracks: ComputedTracklet[], id: string) =>
  tracks.find((tracklet) => tracklet.linkedIds.includes(id))!;

// Each test is drawn as a grid: rows are timepoints and columns are x positions.
// Only the x positions in use are shown, so columns are not to scale. Cells hold
// annotation ids and "." means nothing is there. The default maxDistance is 8.
// "->" means parent to child, and "t0-1" means timepoints 0 through 1.
describe("CenterOfMassTracker", () => {
  // x:   0   2   4   6   8
  // t0   a0  .   .   .   .
  // t1   .   a1  .   .   .
  // t2   .   .   a2  .   .
  // t3   .   .   .   a3  .
  // t4   .   .   .   .   a4
  //
  // Expected: a (t0-4)
  it("links one object over five frames into one tracklet", () => {
    const { tracks } = track([0, 1, 2, 3, 4].map((t) => at(`a${t}`, t, t * 2)));

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({
      seriesId: "series",
      color: "#123456",
      start: 0,
      end: 4,
    });
    expect([...tracks[0].linkedIds].sort()).toEqual([
      "a0",
      "a1",
      "a2",
      "a3",
      "a4",
    ]);
  });

  // x:   0    1  ...  100  101
  // t0   a0   .  ...  b0   .
  // t1   .    a1 ...  .    b1
  //
  // Expected: a (t0-1), b (t0-1)
  it("keeps well separated objects in separate tracklets", () => {
    const { tracks } = track([
      at("a0", 0, 0),
      at("a1", 1, 1),
      at("b0", 0, 100),
      at("b1", 1, 101),
    ]);

    expect(tracks).toHaveLength(2);
    expect(containing(tracks, "a0").linkedIds).toContain("a1");
    expect(containing(tracks, "b0").linkedIds).toContain("b1");
  });

  // x:   5   10  15
  // t0   .   p0  .
  // t1   .   p1  .
  // t2   c0  .   d0
  // t3   c1  .   d1
  //
  // Expected: p (t0-1) -> c (t2-3), d (t2-3)
  it("creates child tracklets with back-links on a split", () => {
    const { tracks } = track(
      [
        at("p0", 0, 10),
        at("p1", 1, 10),
        at("c0", 2, 5),
        at("d0", 2, 15),
        at("c1", 3, 5),
        at("d1", 3, 15),
      ],
      { calculateTrackletRelationships: true },
    );

    const parent = containing(tracks, "p0");
    const childC = containing(tracks, "c0");
    const childD = containing(tracks, "d0");

    expect(tracks).toHaveLength(3);
    expect(parent).toMatchObject({ start: 0, end: 1 });
    expect([...parent.children!].sort()).toEqual([childC.id, childD.id].sort());
    expect(childC).toMatchObject({ start: 2, end: 3, parents: [parent.id] });
    expect(childD).toMatchObject({ start: 2, end: 3, parents: [parent.id] });
    expect(childC.linkedIds).toContain("c1");
  });

  // x:   0   5   10  15  20
  // t0   a0  .   .   .   b0
  // t1   .   a1  .   b1  .
  // t2   .   .   m0  .   .
  // t3   .   .   m1  .   .
  //
  // Expected: a (t0-1), b (t0-1) -> m (t2-3)
  it("creates a merged tracklet with two parents on a merge", () => {
    const { tracks } = track(
      [
        at("a0", 0, 0),
        at("b0", 0, 20),
        at("a1", 1, 5),
        at("b1", 1, 15),
        at("m0", 2, 10),
        at("m1", 3, 10),
      ],
      { calculateTrackletRelationships: true },
    );

    const a = containing(tracks, "a0");
    const b = containing(tracks, "b0");
    const merged = containing(tracks, "m0");

    expect(tracks).toHaveLength(3);
    expect(a).toMatchObject({ start: 0, end: 1, children: [merged.id] });
    expect(b).toMatchObject({ start: 0, end: 1, children: [merged.id] });
    expect(merged).toMatchObject({ start: 2, end: 3 });
    expect([...merged.parents!].sort()).toEqual([a.id, b.id].sort());
    expect([...merged.linkedIds].sort()).toEqual(["m0", "m1"]);
  });

  // x:   3   4   8   12  13
  // t0   y0  .   .   .   x0
  // t1   .   y1  .   x1  .
  // t2   .   .   x2  .   .
  // t3   c0  .   .   .   d0
  // t4   c1  .   .   .   d1
  //
  // Expected: x (t0-1), y (t0-1) -> x2 (t2) -> c (t3-4), d (t3-4)
  it("repoints the children of a split tracklet at the merged tracklet", () => {
    // x splits at frame 3 and y merges into x at frame 2. x is listed last so
    // it is visited first, which makes it the conflicting tracklet
    const { tracks, warnings } = track(
      [
        at("y0", 0, 3),
        at("x0", 0, 13),
        at("y1", 1, 4),
        at("x1", 1, 12),
        at("x2", 2, 8),
        at("c0", 3, 3),
        at("d0", 3, 13),
        at("c1", 4, 3),
        at("d1", 4, 13),
      ],
      { calculateTrackletRelationships: true },
    );

    const parentX = containing(tracks, "x0");
    const parentY = containing(tracks, "y0");
    const merged = containing(tracks, "x2");
    const childC = containing(tracks, "c0");
    const childD = containing(tracks, "d0");

    expect(warnings).toEqual([]);
    expect(tracks).toHaveLength(5);
    expect(parentX.end).toBe(1);
    expect(parentY.end).toBe(1);
    expect(merged.parents?.sort()).toEqual([parentX.id, parentY.id].sort());
    expect(merged.linkedIds).toEqual(["x2"]);
    expect(merged.start).toBe(2);
    expect(merged.end).toBe(2);
    expect([...merged.children!].sort()).toEqual([childC.id, childD.id].sort());
    expect(childC.parents).toEqual([merged.id]);
    expect(childD.parents).toEqual([merged.id]);
  });

  // x:   3   10  17
  // t0   a0  c0  b0
  // t1   a1  c1  b1
  // t2   .   m0  .
  // t3   .   m1  .
  //
  // c is at y=7, everything else is at y=0
  // Expected: a (t0-1), b (t0-1), c (t0-1) -> m (t2-3)
  it("adds a third parent instead of emptying a merged tracklet", () => {
    // The parents are within range of m0 but out of range of each other
    const { tracks, warnings } = track(
      [
        at("a0", 0, 3),
        at("b0", 0, 17),
        at("c0", 0, 10, "kind", 7),
        at("a1", 1, 3),
        at("b1", 1, 17),
        at("c1", 1, 10, "kind", 7),
        at("m0", 2, 10),
        at("m1", 3, 10),
      ],
      { calculateTrackletRelationships: true },
    );

    const parentA = containing(tracks, "a0");
    const parentB = containing(tracks, "b0");
    const parentC = containing(tracks, "c0");
    const merged = containing(tracks, "m0");

    expect(warnings).toEqual([]);
    expect(tracks).toHaveLength(4);
    tracks.forEach(({ linkedIds }) => expect(linkedIds).toHaveLength(2));
    expect([...merged.linkedIds].sort()).toEqual(["m0", "m1"]);
    expect([...merged.parents!].sort()).toEqual(
      [parentA.id, parentB.id, parentC.id].sort(),
    );
    [parentA, parentB, parentC].forEach((parent) => {
      expect(parent.children).toEqual([merged.id]);
    });
  });

  // x:   4   12  20
  // t0   y0  .   x0
  // t1   y1  .   x1
  // t2   y2  .   .
  // t3   .   x3  .
  // t4   .   x4  .
  //
  // Expected: x (t0-1), y (t0-2) -> x3 + x4 (t3-4)
  it("ends a conflicting tracklet at its last annotation across a gap", () => {
    const { tracks } = track(
      [
        at("y0", 0, 4),
        at("x0", 0, 20),
        at("y1", 1, 4),
        at("x1", 1, 20),
        at("y2", 2, 4),
        at("x3", 3, 12),
        at("x4", 4, 12),
      ],
      { calculateTrackletRelationships: true, gapClosingDist: 1 },
    );

    const parentX = containing(tracks, "x0");
    const parentY = containing(tracks, "y0");
    const merged = containing(tracks, "x3");

    expect(parentX).toMatchObject({ start: 0, end: 1 });
    expect(parentY).toMatchObject({ start: 0, end: 2 });
    expect(merged).toMatchObject({ start: 3, end: 4 });
    expect([...merged.parents!].sort()).toEqual(
      [parentX.id, parentY.id].sort(),
    );
  });

  // x:   0
  // t0   a0
  // t1   a1
  // t2   .
  // t3   a3
  // t4   a4
  //
  // Expected: a0 + a1 (t0-1), a3 + a4 (t3-4)
  it("does not bridge a missing frame without gap closing", () => {
    const { tracks } = track([
      at("a0", 0, 0),
      at("a1", 1, 0),
      at("a3", 3, 0),
      at("a4", 4, 0),
    ]);

    expect(tracks).toHaveLength(2);
    expect(
      tracks.map((tracklet) => [...tracklet.linkedIds].sort()),
    ).toMatchObject([
      ["a0", "a1"],
      ["a3", "a4"],
    ]);
  });

  // x:   0
  // t0   a0
  // t1   a1
  // t2   .
  // t3   a3
  // t4   a4
  //
  // gapClosingDist = 1
  // Expected: a (t0-4), including the empty t2
  it("bridges a missing frame with gap closing", () => {
    const { tracks } = track(
      [at("a0", 0, 0), at("a1", 1, 0), at("a3", 3, 0), at("a4", 4, 0)],
      { gapClosingDist: 1 },
    );

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({ start: 0, end: 4 });
    expect(tracks[0].linkedIds).toHaveLength(4);
  });

  // x:   0
  // t0   a0
  // t1   .
  // t2   a2
  // t3   a3
  //
  // gapClosingDist = 1
  // Expected: a (t0-3)
  it("does not link a gap-closed annotation to its own frame", () => {
    const { tracks, warnings } = track(
      [at("a0", 0, 0), at("a2", 2, 0), at("a3", 3, 0)],
      { gapClosingDist: 1, calculateTrackletRelationships: true },
    );

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({ start: 0, end: 3 });
    expect(warnings).toEqual([]);
  });

  // x:   0       100
  // t0   a0      lonely
  // t1   a1      .
  //
  // Expected: a (t0-1), lonely is dropped
  it("drops single frame tracklets by default", () => {
    const { tracks } = track([
      at("a0", 0, 0),
      at("a1", 1, 0),
      at("lonely", 0, 100),
    ]);

    expect(tracks).toHaveLength(1);
    expect(containing(tracks, "lonely")).toBeUndefined();
  });

  // x:   0       100
  // t0   a0      lonely
  // t1   a1      .
  //
  // Expected: a (t0-1), lonely (t0)
  it("keeps single frame tracklets when asked to", () => {
    const { tracks } = track(
      [at("a0", 0, 0), at("a1", 1, 0), at("lonely", 0, 100)],
      { includeIsolatedAnnotations: true },
    );

    expect(containing(tracks, "lonely")).toMatchObject({ start: 0, end: 0 });
  });

  // x:   0     100
  // t0   a0    .
  // t1   a1    late
  //
  // Expected: a (t0-1), late (t1)
  it("keeps isolated annotations in the last frame when asked to", () => {
    const { tracks } = track(
      [at("a0", 0, 0), at("a1", 1, 0), at("late", 1, 100)],
      { includeIsolatedAnnotations: true },
    );

    expect(containing(tracks, "late")).toMatchObject({ start: 1, end: 1 });
  });

  // x:   5   10  15
  // t0   .   p0  .
  // t1   .   p1  .
  // t2   c0  .   d0
  // t3   c1  .   .
  //
  // d0 has no neighbor at t3, so it is dropped and c is p's only child
  // Expected: p + c (t0-3)
  it("extends the end when consolidating a single child", () => {
    // d0 is a single frame child that gets dropped, leaving c as an only child
    const { tracks } = track(
      [
        at("p0", 0, 10),
        at("p1", 1, 10),
        at("c0", 2, 5),
        at("d0", 2, 15),
        at("c1", 3, 5),
      ],
      { calculateTrackletRelationships: true },
    );

    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({ start: 0, end: 3 });
    expect(tracks[0].linkedIds).toHaveLength(4);
  });

  // x:   0   1
  // t0   a0  b0
  // t1   a1  b1
  //
  // a is kindA, b is kindB. They are in range, but must not link
  // Expected: a (t0-1), b (t0-1)
  it("never links annotations of different kinds", () => {
    const { tracks } = track([
      at("a0", 0, 0, "kindA"),
      at("a1", 1, 0, "kindA"),
      at("b0", 0, 1, "kindB"),
      at("b1", 1, 1, "kindB"),
    ]);

    expect(tracks).toHaveLength(2);
    expect(containing(tracks, "a0").linkedIds).toContain("a1");
    expect(containing(tracks, "b0").linkedIds).toContain("b1");
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
    expect(tracks[0].linkedIds).toContain("b0");
  });

  // x:   3   4
  // t0   a0  .
  // t1   .   a1
  //
  // Expected: coms.a0 is at x=3, y=0
  it("returns the centers it tracked with", () => {
    const { coms } = track([at("a0", 0, 3), at("a1", 1, 4)]);

    expect(coms.a0).toEqual({ annotationId: "a0", x: 3, y: 0 });
  });
});
