import { describe, expect, it } from "vitest";

import { Partition } from "core/dl/enums";

import { dataSlice } from "store/data";

import { rleEncodeArray } from "utils/image";

import { AnnotationMode } from "@ImageViewer/utils/enums";

import {
  selectAnnotationsForRender,
  selectIsPickingTarget,
  selectOverlapCandidateIds,
  selectResolvedTargetIds,
  selectSelectionOperandIds,
} from "./reselectors";
import { emptySelectionLayer } from "../imageViewerData/utils";

import type {
  AnnotationObject,
  BBox,
  ExtendedAnnotationObject,
} from "core/entities";

import type { WorkingAnnotation } from "@ImageViewer/utils/types";

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
    encodedMask: rleEncodeArray(grid(rows)),
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
    expect(selectResolvedTargetIds.resultFunc(["A"], [])).toEqual(["A"]);
  });

  it("waits for a pick when several candidates overlap", () => {
    expect(selectResolvedTargetIds.resultFunc(["A", "B"], [])).toEqual([]);
  });

  it("honours a pick among the candidates", () => {
    expect(selectResolvedTargetIds.resultFunc(["A", "B"], ["B"])).toEqual([
      "B",
    ]);
  });

  it("Drops a pick that is no longer a candidate", () => {
    expect(selectResolvedTargetIds.resultFunc(["A", "B"], ["Z", "B"])).toEqual([
      "B",
    ]);
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
    encodedMask: rleEncodeArray(grid(["##", "##"])),
    features: { area: 4 },
  });

  const reduce = (annotation: AnnotationObject, action: unknown) => {
    let state = dataSlice.reducer(undefined, { type: "@@INIT" });
    state = dataSlice.reducer(
      state,
      dataSlice.actions.addAnnotation(annotation),
    );

    return dataSlice.reducer(state, action as any).annotations.entities.A;
  };

  it("replaces geometry and derives shape from the new box", () => {
    const updated = reduce(
      base(),
      dataSlice.actions.updateAnnotationMask({
        id: "A",
        boundingBox: [1, 1, 4, 3],
        encodedMask: rleEncodeArray(grid(["###", "###"])),
        features: { area: 6 },
        intensityMeasurements: { "": { total: 8 } },
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
      dataSlice.actions.updateAnnotationMask({
        id: "A",
        boundingBox: [0, 0, 1, 1],
        encodedMask: rleEncodeArray(grid(["#"])),
        features: undefined,
        intensityMeasurements: { "": { total: 8 } },
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
      dataSlice.actions.updateAnnotationMask({
        id: "nope",
        boundingBox: [0, 0, 1, 1],
        encodedMask: [],
        features: undefined,
        intensityMeasurements: { "": { total: 8 } },
      }),
    );
    expect(updated?.boundingBox).toEqual([0, 0, 2, 2]);
  });
});
