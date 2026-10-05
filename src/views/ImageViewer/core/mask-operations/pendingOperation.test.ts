import { describe, expect, it } from "vitest";

import { rleEncodeArray } from "utils/image";

import { AnnotationMode } from "@ImageViewer/utils/enums";

import { computePendingOperation } from "./pendingOperation";

import type { BBox, ExtendedAnnotationObject } from "core/entities";

import type { WorkingAnnotation } from "@ImageViewer/utils/types";

/** '#' set, '.' clear — the same grid notation the maskOps tests use. */
const grid = (rows: string[]) =>
  Uint8Array.from(
    rows.flatMap((r) => [...r].map((c) => (c === "#" ? 255 : 0))),
  );

const annotation = (
  id: string,
  x0: number,
  y0: number,
  rows: string[],
): ExtendedAnnotationObject =>
  ({
    id,
    boundingBox: [x0, y0, x0 + rows[0].length, y0 + rows.length] as BBox,
    encodedMask: rleEncodeArray(grid(rows)),
  }) as unknown as ExtendedAnnotationObject;

const stroke = (x0: number, y0: number, rows: string[]): WorkingAnnotation =>
  ({
    boundingBox: [x0, y0, x0 + rows[0].length, y0 + rows.length] as BBox,
    decodedMask: grid(rows),
  }) as WorkingAnnotation;

// A and B overlap at (1,1). C is well clear of both.
const A = annotation("A", 0, 0, ["##", "##"]);
const B = annotation("B", 1, 1, ["##", "##"]);
const C = annotation("C", 9, 9, ["#"]);
const ALL = [A, B, C];

const show = (mask: Uint8Array, bbox: BBox) => {
  const w = bbox[2] - bbox[0];
  const rows: string[] = [];
  for (let y = 0; y < bbox[3] - bbox[1]; y++) {
    rows.push(
      [...mask.slice(y * w, (y + 1) * w)]
        .map((v) => (v === 255 ? "#" : "."))
        .join(""),
    );
  }
  return rows;
};

describe("computePendingOperation — stroke against a target", () => {
  const s = stroke(1, 1, ["#"]);

  it("is null with no operation staged", () => {
    expect(
      computePendingOperation(AnnotationMode.New, ALL, s, ["A"], []),
    ).toBeNull();
  });

  it("is null while the target is unresolved", () => {
    expect(
      computePendingOperation(AnnotationMode.Add, ALL, s, [], []),
    ).toBeNull();
  });

  it("subtracts the stroke from the target, leaving identity alone", () => {
    const pending = computePendingOperation(
      AnnotationMode.Subtract,
      ALL,
      s,
      ["A"],
      [],
    );
    expect(pending?.absorbedIds).toEqual([]);
    expect(Object.keys(pending!.updates)).toEqual(["A"]);
    const u = pending!.updates.A;
    expect(show(u.mask, u.bbox)).toEqual(["##", "#."]);
  });

  it("reports empty when the stroke erases the target entirely", () => {
    const pending = computePendingOperation(
      AnnotationMode.Subtract,
      ALL,
      stroke(0, 0, ["##", "##"]),
      ["A"],
      [],
    );
    expect(pending?.empty).toBe(true);
    expect(pending?.updates).toEqual({});
  });
});

describe("computePendingOperation — stroke against multiple targets", () => {
  const s = stroke(1, 1, ["#"]);

  it("Add folds every picked target plus the stroke into the first, absorbs the rest", () => {
    const pending = computePendingOperation(
      AnnotationMode.Add,
      ALL,
      s,
      ["A", "B"],
      [],
    );

    expect(pending?.absorbedIds).toEqual(["B"]);
    expect(Object.keys(pending!.updates)).toEqual(["A"]);
    const u = pending!.updates.A;
    expect(show(u.mask, u.bbox)).toEqual(["##.", "###", ".##"]);
  });

  it("Subtract applies to each picked target independently, absorbs nothing", () => {
    const pending = computePendingOperation(
      AnnotationMode.Subtract,
      ALL,
      s,
      ["A", "B"],
      [],
    );

    expect(pending?.absorbedIds).toEqual([]);
    expect(Object.keys(pending!.updates).sort()).toEqual(["A", "B"]);
    const uA = pending!.updates.A;
    const uB = pending!.updates.B;
    expect(show(uA.mask, uA.bbox)).toEqual(["##", "#."]);
    expect(show(uB.mask, uB.bbox)).toEqual([".#", "##"]);
  });

  it("Intersect applies to each picked target independently, absorbs nothing", () => {
    const pending = computePendingOperation(
      AnnotationMode.Intersect,
      ALL,
      s,
      ["A", "B"],
      [],
    );

    expect(pending?.absorbedIds).toEqual([]);
    expect(Object.keys(pending!.updates).sort()).toEqual(["A", "B"]);
    const uA = pending!.updates.A;
    const uB = pending!.updates.B;
    expect(show(uA.mask, uA.bbox)).toEqual(["#"]);
    expect(show(uB.mask, uB.bbox)).toEqual(["#"]);
  });
});

describe("computePendingOperation — click-selected operands", () => {
  it("folds into the first operand and absorbs the rest", () => {
    const pending = computePendingOperation(
      AnnotationMode.Add,
      ALL,
      undefined,
      [],
      ["A", "B"],
    );
    expect(pending?.absorbedIds).toEqual(["B"]);
    const u = pending!.updates.A;
    expect(show(u.mask, u.bbox)).toEqual(["##.", "###", ".##"]);
  });

  it("makes the first operand the minuend for subtract", () => {
    const pending = computePendingOperation(
      AnnotationMode.Subtract,
      ALL,
      undefined,
      [],
      ["B", "A"],
    );
    // B less A leaves B's three pixels outside the shared one.
    expect(Object.keys(pending!.updates)).toEqual(["B"]);
    expect(pending?.absorbedIds).toEqual(["A"]);
    const u = pending!.updates.B;
    expect(show(u.mask, u.bbox)).toEqual([".#", "##"]);
  });

  it("reports empty for a disjoint intersection", () => {
    const pending = computePendingOperation(
      AnnotationMode.Intersect,
      ALL,
      undefined,
      [],
      ["A", "C"],
    );
    expect(pending?.empty).toBe(true);
  });

  it("needs two operands", () => {
    expect(
      computePendingOperation(AnnotationMode.Add, ALL, undefined, [], ["A"]),
    ).toBeNull();
  });
});
