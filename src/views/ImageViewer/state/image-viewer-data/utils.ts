import {
  OBJECT_FEATURES,
  type ExtendedAnnotationObject,
  type ExtendedKind,
  type ObjectFeature,
} from "core/entities";

import type {
  FeatureParams,
  FeatureRange,
  FeatureRangeState,
  FeatureState,
  FilterLayer,
  LayerCriterion,
  LayerMode,
  PlaneScope,
  SelectionLayer,
} from "../types";

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
const emptyFeatureState = (): FeatureState =>
  Object.fromEntries(
    Object.keys(FEATURES).map((k) => [
      k,
      { active: false, min: null, max: null },
    ]),
  ) as FeatureState;

export const emptySelectionLayer = (): SelectionLayer => ({
  catIds: [],
  features: emptyFeatureState(),
  includeIds: [],
  excludeIds: [],
});

export const resolveRange = (
  { min, max }: FeatureRangeState,
  [lo, hi]: [number, number],
): [number, number] => [min ?? lo, max ?? hi];

export const activeFeatureList = (
  feats: FeatureState,
  params: FeatureParams,
): FeatureRange[] =>
  (Object.entries(feats) as [ObjectFeature, FeatureRangeState][])
    .filter(([, v]) => v.active)
    .map(([feature, v]) => {
      const [min, max] = resolveRange(v, params[feature].bounds);
      return { feature, min, max };
    });
/**
 * Slider limits for the feature filters: the real range of each feature across
 * the given annotations. `FEATURES` supplies label/unit/step, and its bounds are
 * only a fallback for a feature no annotation reports. Seeding the range from
 * those bounds instead pins the limit at the static value (area's 2000) and
 * stops it tracking the data at all, so deleting the largest annotation never
 * narrows anything.
 */
export const generateFeatureConfig = (
  annotations: Array<Pick<ExtendedAnnotationObject, "features">>,
): FeatureParams => {
  const base = Object.fromEntries(
    Object.entries(FEATURES).map(([k, v]) => [
      k,
      { ...v, bounds: [...v.bounds] },
    ]),
  ) as FeatureParams;

  const seen = new Set<ObjectFeature>();
  annotations.forEach((ann) => {
    OBJECT_FEATURES.forEach((f) => {
      const featVal = ann.features?.[f];
      if (featVal === undefined) return;
      const cfg = base[f];
      if (!seen.has(f)) {
        cfg.bounds = [featVal, featVal];
        seen.add(f);
        return;
      }
      if (featVal < cfg.bounds[0]) cfg.bounds[0] = featVal;
      else if (featVal > cfg.bounds[1]) cfg.bounds[1] = featVal;
    });
  });

  // One annotation, or a feature that happens to be constant across them, gives
  // min === max, which MUI's Slider renders as an unusable track.
  seen.forEach((f) => {
    const cfg = base[f];
    if (cfg.bounds[0] === cfg.bounds[1])
      cfg.bounds = [cfg.bounds[0], cfg.bounds[1] + cfg.step];
  });

  return base;
};

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
