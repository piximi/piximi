import type {
  ExtendedAnnotationObject,
  ExtendedKind,
  FeatureKey,
} from "store/dataV2/types";

import type {
  FeatureConfig,
  FeatureRange,
  FeatureRangeState,
  FeatureState,
  FilterLayer,
  LayerCriterion,
  PlaneScope,
  SelectionLayer,
} from "../types";

export type FeatureParams = Record<FeatureKey, FeatureConfig>;
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
 * An annotation matches when it belongs to one of the chosen categories/kinds
 * (or none were chosen) AND satisfies every active feature range.
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
): boolean => {
  if (layer.includeIds?.includes(a.id)) return true;
  if (layer.excludeIds?.includes(a.id)) return false;

  const hasCat = !!(layer.catIds?.length || layer.kindIds?.length);
  const hasFeat = !!layer.features?.length;
  if (!hasCat && !hasFeat) return false;

  if (
    hasCat &&
    !(layer.catIds ?? []).includes(a.categoryId) &&
    !(layer.kindIds ?? []).includes(a.kindId)
  )
    return false;

  for (const f of layer.features ?? []) {
    const v = a.features?.[f.feature];
    if (v === undefined || v < f.min || v > f.max) return false;
  }
  return true;
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
  return base.filter((a) =>
    layer.mode === "keep" ? matchesLayer(a, layer) : !matchesLayer(a, layer),
  );
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
  feature: FeatureKey,
  [min, max]: [number, number],
): string[] =>
  annotations
    .filter((a) => {
      const v = a.features?.[feature];
      return v !== undefined && v >= min && v <= max;
    })
    .map((a) => a.id);

export const activeFeatureList = (feats: FeatureState): FeatureRange[] =>
  (Object.entries(feats) as [FeatureKey, FeatureRangeState][])
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
