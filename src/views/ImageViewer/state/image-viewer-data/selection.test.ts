import { describe, expect, it } from "vitest";

import { imageViewerDataSlice } from "./imageViewerDataSlice";
import { selectSelectedAnnotations } from "./reselectors";
import {
  applyFilterLayer,
  idsInCategories,
  idsInFeatureRange,
  matchesLayer,
} from "./utils";

import type { UnknownAction } from "@reduxjs/toolkit";
import type {
  ExtendedAnnotationObject,
  ExtendedKind,
} from "store/dataV2/types";
import type { ImageViewerDataState } from "../types";

const C1 = "cat-1";
const C2 = "cat-2";
const KIND = "kind-1";
// The feature range "f" used throughout: area 0–500.
const F: [number, number] = [0, 500];

const ann = (
  id: string,
  categoryId: string,
  area: number,
): ExtendedAnnotationObject =>
  ({
    id,
    categoryId,
    kindId: KIND,
    features: { area },
  }) as unknown as ExtendedAnnotationObject;

// a_c1 / a_c2 sit in c1 / c2 and *outside* f; a_c1f / a_c2f sit inside f.
const a_c1 = ann("a_c1", C1, 900);
const a_c1f = ann("a_c1f", C1, 400);
const a_c2 = ann("a_c2", C2, 900);
const a_c2f = ann("a_c2f", C2, 300);
const ALL = [a_c1, a_c1f, a_c2, a_c2f];

// A third, never-selected category keeps `splitSelection` from collapsing
// c1 + c2 into a kind-level match, which would stop exercising category ids.
const kinds: ExtendedKind[] = [
  { id: KIND, cats: [{ id: C1 }, { id: C2 }, { id: "cat-3" }] },
] as unknown as ExtendedKind[];

const A = imageViewerDataSlice.actions;

/** Check a category on, carrying the exclusions that category admits. */
const addCat = (...ids: string[]) =>
  A.toggleCatSelection({ ids, on: true, admits: idsInCategories(ALL, ids) });
/** Uncheck a category. Removals clear no exclusions. */
const dropCat = (...ids: string[]) => A.toggleCatSelection({ ids, on: false });
const activateF = () =>
  A.toggleFeatureSelection({
    key: "area",
    bounds: F,
    admits: idsInFeatureRange(ALL, "area", F),
  });
/** Same reducer, flipping the feature back off — no admits on the way out. */
const deactivateF = () =>
  A.toggleFeatureSelection({ key: "area", bounds: F });
const widenF = () =>
  A.updateFeatureSelection({ key: "area", range: [0, 600] });
const click = (id: string, on: boolean) =>
  A.toggleAnnotationSelection({ ids: [id], on });

/** Replays actions against the real reducer and reports the selected set. */
const session = () => {
  let state: ImageViewerDataState = imageViewerDataSlice.reducer(
    undefined,
    { type: "@@INIT" } as UnknownAction,
  );
  return {
    run(...actions: UnknownAction[]) {
      actions.forEach((a) => {
        state = imageViewerDataSlice.reducer(state, a);
      });
      return this;
    },
    selected(): string[] {
      return selectSelectedAnnotations
        .resultFunc(ALL, state.selectionLayer, kinds)
        .map((a) => a.id);
    },
    get layer() {
      return state.selectionLayer;
    },
  };
};

describe("matchesLayer", () => {
  it("matches nothing when the criterion has no positive term", () => {
    expect(matchesLayer(a_c1, {})).toBe(false);
    expect(matchesLayer(a_c1, { catIds: [], kindIds: [], features: [] })).toBe(
      false,
    );
  });

  it("matches only the listed ids for an id-only criterion", () => {
    const layer = { includeIds: ["a_c1"] };
    expect(matchesLayer(a_c1, layer)).toBe(true);
    expect(matchesLayer(a_c2, layer)).toBe(false);
  });

  it("lets an include beat a criterion the annotation does not match", () => {
    expect(matchesLayer(a_c2, { catIds: [C1], includeIds: ["a_c2"] })).toBe(
      true,
    );
  });

  it("lets an exclude veto a criterion the annotation does match", () => {
    expect(matchesLayer(a_c1, { catIds: [C1], excludeIds: ["a_c1"] })).toBe(
      false,
    );
  });

  it("intersects the category group with the feature group", () => {
    const layer = {
      catIds: [C1],
      features: [{ feature: "area" as const, min: F[0], max: F[1] }],
    };
    expect(matchesLayer(a_c1f, layer)).toBe(true); // in c1, in range
    expect(matchesLayer(a_c1, layer)).toBe(false); // in c1, out of range
    expect(matchesLayer(a_c2f, layer)).toBe(false); // in range, wrong category
  });
});

describe("selection scenarios", () => {
  it("S1: adding a term restores an excluded annotation, removing one does not", () => {
    const s = session().run(addCat(C1));
    expect(s.selected()).toContain("a_c1f");

    s.run(click("a_c1f", false));
    expect(s.selected()).not.toContain("a_c1f");

    s.run(activateF()); // an addition — clears exclusions inside the range
    expect(s.selected()).toContain("a_c1f");

    s.run(click("a_c1f", false));
    expect(s.selected()).not.toContain("a_c1f");

    s.run(deactivateF()); // a removal — clears nothing
    expect(s.selected()).not.toContain("a_c1f");
  });

  it("S2/A: a hand-picked include survives the criterion that arrives and leaves", () => {
    const s = session().run(click("a_c1f", true));
    expect(s.selected()).toEqual(["a_c1f"]);

    s.run(addCat(C1));
    expect(s.selected()).toContain("a_c1f");

    s.run(dropCat(C1));
    expect(s.selected()).toEqual(["a_c1f"]);
  });

  it("B: re-checking a category clears its own exclusions", () => {
    const s = session().run(addCat(C1), click("a_c1", false));
    expect(s.selected()).not.toContain("a_c1");

    s.run(dropCat(C1));
    expect(s.selected()).toEqual([]);

    s.run(addCat(C1));
    expect(s.selected()).toContain("a_c1");
  });

  it("C: activating a range clears an exclusion the range admits", () => {
    const s = session().run(addCat(C1), click("a_c1f", false), activateF());
    expect(s.selected()).toContain("a_c1f");
  });

  it("checking a second category does not resurrect the first's exclusion", () => {
    const s = session().run(addCat(C1), click("a_c1", false));
    expect(s.selected()).not.toContain("a_c1");

    s.run(addCat(C2));
    expect(s.selected()).not.toContain("a_c1");
    expect(s.selected()).toContain("a_c2");

    s.run(click("a_c2", false), dropCat(C1));
    expect(s.selected()).not.toContain("a_c1");
    expect(s.selected()).not.toContain("a_c2");
  });

  it("re-checking a category revives an exclusion that had gone inert", () => {
    const s = session().run(
      addCat(C1),
      click("a_c1", false),
      addCat(C2),
      dropCat(C1),
    );
    expect(s.layer.excludeIds).toContain("a_c1"); // inert: matches no term
    expect(s.selected()).not.toContain("a_c1");

    s.run(addCat(C1));
    expect(s.selected()).toContain("a_c1");
  });

  it("keeps an exclusion alive when the annotation still matches a remaining term", () => {
    const s = session().run(
      addCat(C1),
      activateF(),
      click("a_c1f", false),
      dropCat(C1),
    );
    // The criterion is now f alone, which a_c1f still satisfies — so the
    // exclusion is not stale and must survive.
    expect(s.selected()).toContain("a_c2f");
    expect(s.selected()).not.toContain("a_c1f");
  });

  it("does not clear exclusions when a range's bounds are dragged", () => {
    const s = session().run(addCat(C1), activateF(), click("a_c1f", false));
    expect(s.selected()).not.toContain("a_c1f");

    s.run(widenF());
    expect(s.selected()).not.toContain("a_c1f");
  });

  it("clears every override when the selection layer is cleared", () => {
    const s = session().run(
      click("a_c1", true),
      addCat(C2),
      click("a_c2", false),
      A.clearSelectionLayer(),
    );
    expect(s.layer.includeIds).toEqual([]);
    expect(s.layer.excludeIds).toEqual([]);
    expect(s.selected()).toEqual([]);
  });
});

describe("applyFilterLayer with manual overrides", () => {
  const base = { enabled: true, catIds: [], kindIds: [], features: [] };

  it("keeps exactly the picked annotations on a keep layer", () => {
    const kept = applyFilterLayer(
      ALL,
      "stack",
      { ...base, mode: "keep", includeIds: ["a_c1"], excludeIds: [] },
      0,
    );
    expect(kept.map((a) => a.id)).toEqual(["a_c1"]);
  });

  it("hides exactly the picked annotations on a hide layer", () => {
    const kept = applyFilterLayer(
      ALL,
      "stack",
      { ...base, mode: "hide", includeIds: ["a_c1"], excludeIds: [] },
      0,
    );
    expect(kept.map((a) => a.id)).not.toContain("a_c1");
    expect(kept).toHaveLength(3);
  });

  it("exempts an excluded annotation from a hide layer", () => {
    const kept = applyFilterLayer(
      ALL,
      "stack",
      { ...base, mode: "hide", catIds: [C1], includeIds: [], excludeIds: ["a_c1"] },
      0,
    );
    // c1 is hidden, but a_c1 was hand-excluded from the predicate, so it stays.
    expect(kept.map((a) => a.id)).toContain("a_c1");
    expect(kept.map((a) => a.id)).not.toContain("a_c1f");
  });
});
