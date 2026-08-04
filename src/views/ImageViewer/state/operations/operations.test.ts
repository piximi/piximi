import { describe, expect, it } from "vitest";

import { dataSliceV2 } from "store/dataV2";
import { AnnotationMode } from "views/ImageViewer/utils/enums";
import { encode } from "views/ImageViewer/utils/rle";
import type {
  AnnotationObject,
  BBox,
  ExtendedAnnotationObject,
} from "store/dataV2/types";

import { Partition } from "utils/dl/enums";

import {
  selectAnnotationsForRender,
  selectIsPickingTarget,
  selectOverlapCandidateIds,
  selectPendingOperation,
  selectResolvedTargetId,
  selectSelectionOperandIds,
} from "./reselectors";
import { emptySelectionLayer } from "../image-viewer-data/utils";

import type { WorkingAnnotation } from "views/ImageViewer/utils/types";
import type { SelectionLayer } from "../types";

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
    volumeId: `vol-${id}`,
    categoryId: "cat-1",
    kindId: "kind-1",
    category: { id: "cat-1", color: "#123456" },
    boundingBox: [x0, y0, x0 + rows[0].length, y0 + rows.length] as BBox,
    encodedMask: encode(grid(rows)),
  }) as unknown as ExtendedAnnotationObject;

const stroke = (x0: number, y0: number, rows: string[]): WorkingAnnotation =>
  ({
    boundingBox: [x0, y0, x0 + rows[0].length, y0 + rows.length] as BBox,
    decodedMask: grid(rows),
    imageId: "img-1",
    planeId: "plane-1",
  }) as WorkingAnnotation;

const layerWith = (includeIds: string[]): SelectionLayer => ({
  ...emptySelectionLayer(),
  includeIds,
});

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

describe("selectOverlapCandidateIds", () => {
  it("is empty without a stroke", () => {
    expect(selectOverlapCandidateIds.resultFunc(ALL, undefined)).toEqual([]);
  });

  it("finds only annotations the stroke's mask actually touches", () => {
    // Covers A's (1,1) and B's (1,1); never reaches C.
    expect(
      selectOverlapCandidateIds.resultFunc(ALL, stroke(1, 1, ["#"])),
    ).toEqual(["A", "B"]);
  });

  it("ignores a stroke that only shares a bounding box, not pixels", () => {
    const hollow = annotation("H", 0, 0, ["#.", ".."]);
    expect(
      selectOverlapCandidateIds.resultFunc([hollow], stroke(1, 1, ["#"])),
    ).toEqual([]);
  });
});

describe("selectResolvedTargetId", () => {
  it("resolves a single candidate implicitly", () => {
    expect(selectResolvedTargetId.resultFunc(["A"], undefined)).toBe("A");
  });

  it("waits for a pick when several candidates overlap", () => {
    expect(
      selectResolvedTargetId.resultFunc(["A", "B"], undefined),
    ).toBeUndefined();
  });

  it("honours a pick among the candidates", () => {
    expect(selectResolvedTargetId.resultFunc(["A", "B"], "B")).toBe("B");
  });

  it("ignores a pick that is no longer a candidate", () => {
    expect(selectResolvedTargetId.resultFunc(["A", "B"], "Z")).toBeUndefined();
  });
});

describe("selectSelectionOperandIds", () => {
  it("keeps click order and drops ids that are not visible", () => {
    expect(
      selectSelectionOperandIds.resultFunc(layerWith(["B", "gone", "A"]), ALL),
    ).toEqual(["B", "A"]);
  });

  it("ignores criterion-selected annotations, which carry no order", () => {
    // catIds are set but nothing was clicked, so there are no operands.
    expect(
      selectSelectionOperandIds.resultFunc(
        { ...emptySelectionLayer(), catIds: ["cat-1"] },
        ALL,
      ),
    ).toEqual([]);
  });
});

describe("selectIsPickingTarget", () => {
  it("is true only for a combining operation with an ambiguous stroke", () => {
    const s = stroke(1, 1, ["#"]);
    expect(
      selectIsPickingTarget.resultFunc(AnnotationMode.Add, s, ["A", "B"]),
    ).toBe(true);
    expect(selectIsPickingTarget.resultFunc(AnnotationMode.Add, s, ["A"])).toBe(
      false,
    );
    expect(
      selectIsPickingTarget.resultFunc(AnnotationMode.New, s, ["A", "B"]),
    ).toBe(false);
    expect(
      selectIsPickingTarget.resultFunc(AnnotationMode.Invert, s, ["A", "B"]),
    ).toBe(false);
  });
});

describe("selectPendingOperation — stroke against a target", () => {
  const s = stroke(1, 1, ["#"]);

  it("is null with no operation staged", () => {
    expect(
      selectPendingOperation.resultFunc(AnnotationMode.New, ALL, s, "A", []),
    ).toBeNull();
  });

  it("is null while the target is unresolved", () => {
    expect(
      selectPendingOperation.resultFunc(
        AnnotationMode.Add,
        ALL,
        s,
        undefined,
        [],
      ),
    ).toBeNull();
  });

  it("subtracts the stroke from the target, leaving identity alone", () => {
    const pending = selectPendingOperation.resultFunc(
      AnnotationMode.Subtract,
      ALL,
      s,
      "A",
      [],
    );
    expect(pending?.absorbedIds).toEqual([]);
    expect(Object.keys(pending!.updates)).toEqual(["A"]);
    const u = pending!.updates.A;
    expect(show(u.mask, u.bbox)).toEqual(["##", "#."]);
  });

  it("reports empty when the stroke erases the target entirely", () => {
    const pending = selectPendingOperation.resultFunc(
      AnnotationMode.Subtract,
      ALL,
      stroke(0, 0, ["##", "##"]),
      "A",
      [],
    );
    expect(pending?.empty).toBe(true);
    expect(pending?.updates).toEqual({});
  });
});

describe("selectPendingOperation — click-selected operands", () => {
  it("folds into the first operand and absorbs the rest", () => {
    const pending = selectPendingOperation.resultFunc(
      AnnotationMode.Add,
      ALL,
      undefined,
      undefined,
      ["A", "B"],
    );
    expect(pending?.absorbedIds).toEqual(["B"]);
    const u = pending!.updates.A;
    expect(show(u.mask, u.bbox)).toEqual(["##.", "###", ".##"]);
  });

  it("makes the first operand the minuend for subtract", () => {
    const pending = selectPendingOperation.resultFunc(
      AnnotationMode.Subtract,
      ALL,
      undefined,
      undefined,
      ["B", "A"],
    );
    // B less A leaves B's three pixels outside the shared one.
    expect(Object.keys(pending!.updates)).toEqual(["B"]);
    expect(pending?.absorbedIds).toEqual(["A"]);
    const u = pending!.updates.B;
    expect(show(u.mask, u.bbox)).toEqual([".#", "##"]);
  });

  it("reports empty for a disjoint intersection", () => {
    const pending = selectPendingOperation.resultFunc(
      AnnotationMode.Intersect,
      ALL,
      undefined,
      undefined,
      ["A", "C"],
    );
    expect(pending?.empty).toBe(true);
  });

  it("needs two operands", () => {
    expect(
      selectPendingOperation.resultFunc(
        AnnotationMode.Add,
        ALL,
        undefined,
        undefined,
        ["A"],
      ),
    ).toBeNull();
  });
});

describe("selectPendingOperation — invert", () => {
  it("transforms each operand independently and absorbs nothing", () => {
    const donut = annotation("D", 0, 0, ["...", ".#.", "..."]);
    const pending = selectPendingOperation.resultFunc(
      AnnotationMode.Invert,
      [donut, A],
      undefined,
      undefined,
      ["D", "A"],
    );
    expect(pending?.absorbedIds).toEqual([]);
    // D inverts to a ring; A is fully set so its inverse is empty and it drops out.
    expect(Object.keys(pending!.updates)).toEqual(["D"]);
    const u = pending!.updates.D;
    expect(show(u.mask, u.bbox)).toEqual(["###", "#.#", "###"]);
  });

  it("has no stroke form", () => {
    expect(
      selectPendingOperation.resultFunc(
        AnnotationMode.Invert,
        ALL,
        stroke(1, 1, ["#"]),
        undefined,
        ["A"],
      ),
    ).toBeNull();
  });
});

describe("selectAnnotationsForRender", () => {
  it("passes annotations through untouched with nothing staged", () => {
    expect(selectAnnotationsForRender.resultFunc(ALL, null)).toBe(ALL);
  });

  it("passes through when the staged operation is empty", () => {
    expect(
      selectAnnotationsForRender.resultFunc(ALL, {
        updates: {},
        absorbedIds: [],
        empty: true,
      }),
    ).toBe(ALL);
  });

  it("previews the survivor in place and hides what is absorbed", () => {
    const result = selectAnnotationsForRender.resultFunc(ALL, {
      updates: { A: { mask: grid(["#"]), bbox: [1, 1, 2, 2] as BBox } },
      absorbedIds: ["B"],
      empty: false,
    });
    const byId = Object.fromEntries(result.map((a) => [a.id, a]));

    expect(byId.A.isPreview).toBe(true);
    expect(byId.A.boundingBox).toEqual([1, 1, 2, 2]);
    // The decoded pending mask rides along so the mesh needs no decode.
    expect(byId.A.decodedMask).toEqual(grid(["#"]));
    // Identity is untouched by the preview.
    expect(byId.A.volumeId).toBe("vol-A");

    expect(byId.B.hidden).toBe(true);
    expect(byId.C.hidden).toBeUndefined();
    expect(byId.C.isPreview).toBeUndefined();
  });
});

describe("updateAnnotationMask", () => {
  const base = (): AnnotationObject => ({
    id: "A",
    planeId: "plane-1",
    imageId: "img-1",
    volumeId: "vol-A",
    partition: Partition.Unassigned,
    shape: { planes: 1, width: 2, height: 2, channels: 3 },
    boundingBox: [0, 0, 2, 2],
    encodedMask: encode(grid(["##", "##"])),
    features: { area: 4 },
  });

  const reduce = (annotation: AnnotationObject, action: unknown) => {
    let state = dataSliceV2.reducer(undefined, { type: "@@INIT" });
    state = dataSliceV2.reducer(
      state,
      dataSliceV2.actions.addAnnotation(annotation),
    );

    return dataSliceV2.reducer(state, action as any).annotations.entities.A;
  };

  it("replaces geometry and derives shape from the new box", () => {
    const updated = reduce(
      base(),
      dataSliceV2.actions.updateAnnotationMask({
        id: "A",
        boundingBox: [1, 1, 4, 3],
        encodedMask: encode(grid(["###", "###"])),
        features: { area: 6 },
      }),
    );
    expect(updated?.boundingBox).toEqual([1, 1, 4, 3]);
    expect(updated?.features).toEqual({ area: 6 });
    // width/height track the box; planes/channels carry over.
    expect(updated?.shape).toEqual({
      planes: 1,
      width: 3,
      height: 2,
      channels: 3,
    });
  });

  it("leaves identity and partition alone", () => {
    const updated = reduce(
      base(),
      dataSliceV2.actions.updateAnnotationMask({
        id: "A",
        boundingBox: [0, 0, 1, 1],
        encodedMask: encode(grid(["#"])),
        features: undefined,
      }),
    );
    expect(updated?.id).toBe("A");
    expect(updated?.volumeId).toBe("vol-A");
    expect(updated?.planeId).toBe("plane-1");
    expect(updated?.partition).toBe(Partition.Unassigned);
  });

  it("is a no-op for an unknown id", () => {
    const updated = reduce(
      base(),
      dataSliceV2.actions.updateAnnotationMask({
        id: "nope",
        boundingBox: [0, 0, 1, 1],
        encodedMask: [],
        features: undefined,
      }),
    );
    expect(updated?.boundingBox).toEqual([0, 0, 2, 2]);
  });
});
