import type {
  ExtendedAnnotationObject,
  ExtendedKind,
  ObjectFeature,
} from "core/entities";

import type {
  FeatureConfig,
  FeatureRange,
  FeatureRangeState,
  FeatureState,
  FilterLayer,
  LayerCriterion,
  LayerMode,
  PlaneScope,
  SelectionLayer,
} from "../types";

export type FeatureParams = Record<ObjectFeature, FeatureConfig>;
// Numeric features for the persistent Feature-filter section: [min, max, step].
export const FEATURES: FeatureParams = {
  area: { label: "Area", unit: "px²", bounds: [0, 2000], step: 10 },
  sphericity: { label: "Sphericity", unit: "", bounds: [0.4, 1], step: 0.01 },
  radius: { label: "Radius", unit: "px", bounds: [0, 25], step: 0.5 },
  perimeter: { label: "Perimeter", unit: "px", bounds: [0, 420], step: 5 },
  extent: { label: "extent", unit: "", bounds: [0, 1], step: 0.01 },
  bboxArea: { label: "bboxArea", unit: "px²", bounds: [0, 2000], step: 1 },
  eqpc: { label: "eqpc", unit: "px²", bounds: [0, 2000], step: 1 },
  ped: { label: "ped", unit: "px", bounds: [0, 420], step: 1 },
  compactness: { label: "compactness", unit: "", bounds: [1, 100], step: 1 },
  comX: { label: "comX", unit: "px", bounds: [0, 500], step: 1 },
  comY: { label: "comY", unit: "px", bounds: [0, 500], step: 1 },
};
const emptyFeatureState = (features?: FeatureParams): FeatureState =>
  Object.fromEntries(
    Object.entries(features ?? FEATURES).map(([k, v]) => [
      k,
      { active: false, min: v.bounds[0], max: v.bounds[1] },
    ]),
  ) as FeatureState;

export const emptySelectionLayer = (
  features?: FeatureParams,
): SelectionLayer => ({
  catIds: [],
  features: emptyFeatureState(features),
  includeIds: [],
  excludeIds: [],
});

/**
 * A filter layer holds a *compound* criterion built from the selection surface:
 *   { enabled, mode: 'keep' | 'hide',
 *     catIds: string[], kindIds: string[], features: [{ feature, min, max }],
 *     includeIds: string[], excludeIds: string[] }
 *
 * Categories and kinds form one group, matched by belonging to any of them; the
 * feature ranges form another, matched by satisfying all of them. How the two
 * groups combine depends on `mode`, because every criterion added to a layer
 * should narrow what is left on screen:
 *
 *   keep — matches = catGroup AND featGroup   (matched annotations are shown)
 *   hide — matches = catGroup OR  featGroup   (matched annotations are hidden)
 *
 * They are duals. ANDing the groups under `hide` would *widen* the view as terms
 * were added: hiding "Nucleus", then adding "area 0–500", would bring every
 * large nucleus back. `mode` defaults to keep, which is the right reading for
 * the live selection layer — the terms of a single Apply always intersect.
 *
 * The id sets are a union term and a veto, not further AND clauses — an include
 * wins outright, an exclude vetoes outright. Consequently a criterion with no
 * positive term matches *nothing*: without that, an id-only criterion would fall
 * through to the category/feature checks, which both default to true, and match
 * every annotation.
 */
export const matchesLayer = (
  a: ExtendedAnnotationObject,
  layer: LayerCriterion,
  mode: LayerMode = "keep",
): boolean => {
  if (layer.includeIds?.includes(a.id)) return true;
  if (layer.excludeIds?.includes(a.id)) return false;

  const hasCat = !!(layer.catIds?.length || layer.kindIds?.length);
  const hasFeat = !!layer.features?.length;
  if (!hasCat && !hasFeat) return false;

  const catMatch =
    (layer.catIds ?? []).includes(a.categoryId) ||
    (layer.kindIds ?? []).includes(a.kindId);
  const featMatch = (layer.features ?? []).every((f) => {
    const v = a.features?.[f.feature];
    return v !== undefined && v >= f.min && v <= f.max;
  });

  // With only one group present there is nothing to combine, and an absent
  // group must not vote: `featMatch` is vacuously true with no ranges, which
  // would make a hide layer match everything.
  if (!hasCat) return featMatch;
  if (!hasFeat) return catMatch;
  return mode === "keep" ? catMatch && featMatch : catMatch || featMatch;
};

const baseSet = (
  annotations: ExtendedAnnotationObject[],
  planeScope: PlaneScope,
  currentPlane: number,
): ExtendedAnnotationObject[] =>
  planeScope === "stack"
    ? annotations
    : annotations.filter((a) => a.planeIdx === currentPlane);

/**
 * The plane-scoped base, with the single filter layer applied on top
 * (a disabled or absent layer passes everything through unchanged).
 */
export const applyFilterLayer = (
  annotations: ExtendedAnnotationObject[],
  planeScope: PlaneScope,
  layer: FilterLayer | undefined,
  currentPlane: number,
): ExtendedAnnotationObject[] => {
  const base = baseSet(annotations, planeScope, currentPlane);
  if (!layer?.enabled) return base;
  return base.filter((a) => {
    const matched = matchesLayer(a, layer, layer.mode);
    return layer.mode === "keep" ? matched : !matched;
  });
};

// Build the (kindIds, catIds) split for a set of selected category ids,
// collapsing a fully-selected kind to its kindId for a tidy label.
export const splitSelection = (
  selCatIds: string[],
  kinds: ExtendedKind[],
): { kindIds: string[]; catIds: string[] } => {
  const sel = new Set(selCatIds);
  const kindIds: string[] = [];
  const catIds: string[] = [];
  for (const k of kinds) {
    const all = k.cats.length > 0 && k.cats.every((c) => sel.has(c.id));
    const any = k.cats.some((c) => sel.has(c.id));
    if (all) kindIds.push(k.id);
    else if (any) k.cats.forEach((c) => sel.has(c.id) && catIds.push(c.id));
  }
  return { kindIds, catIds };
};

/**
 * The annotation ids a newly-activated criterion term admits — the scope within
 * which manual exclusions are dropped. A term only ever clears exclusions among
 * its *own* matches, so checking a second category never resurrects an
 * annotation excluded from the first.
 *
 * Computed against every annotation on the image rather than the visible set:
 * an exclusion is a per-annotation fact, and scoping the clear to what's
 * currently visible would leave filter-hidden annotations excluded, to resurface
 * that way once the filter is disabled.
 */
export const idsInCategories = (
  annotations: ExtendedAnnotationObject[],
  catIds: string[],
): string[] =>
  annotations.filter((a) => catIds.includes(a.categoryId)).map((a) => a.id);

export const idsInFeatureRange = (
  annotations: ExtendedAnnotationObject[],
  feature: ObjectFeature,
  [min, max]: [number, number],
): string[] =>
  annotations
    .filter((a) => {
      const v = a.features?.[feature];
      return v !== undefined && v >= min && v <= max;
    })
    .map((a) => a.id);

export const activeFeatureList = (feats: FeatureState): FeatureRange[] =>
  (Object.entries(feats) as [ObjectFeature, FeatureRangeState][])
    .filter(([, v]) => v.active)
    .map(([feature, v]) => ({
      feature,
      min: Number(v.min),
      max: Number(v.max),
    }));

// Merge a new selection's active feature ranges into an existing layer's
// ranges, overwriting by feature key — a feature untouched by the new
// selection keeps its previously-set range.
export const mergeFeatureRanges = (
  existing: FeatureRange[],
  incoming: FeatureRange[],
): FeatureRange[] => {
  const byKey = new Map(existing.map((f) => [f.feature, f]));
  incoming.forEach((f) => byKey.set(f.feature, f));
  return [...byKey.values()];
};
