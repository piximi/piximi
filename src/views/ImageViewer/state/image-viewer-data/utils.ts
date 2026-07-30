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
} from "../types";

export type FeatureParams = Record<FeatureKey, FeatureConfig>;
// Numeric features for the persistent Feature-filter section: [min, max, step].
export const FEATURES: FeatureParams = {
  area: { label: "Area", unit: "px²", bounds: [0, 2000], step: 10 },
  sphericity: { label: "Sphericity", unit: "", bounds: [0.4, 1], step: 0.01 },
  radius: { label: "Radius", unit: "µm", bounds: [0, 25], step: 0.5 },
  perimeter: { label: "Perimeter", unit: "px", bounds: [0, 420], step: 5 },
};
export const emptyFeatureState = (features?: FeatureParams): FeatureState =>
  Object.fromEntries(
    Object.entries(features ?? FEATURES).map(([k, v]) => [
      k,
      { active: false, min: v.bounds[0], max: v.bounds[1] },
    ]),
  ) as FeatureState;

/**
 * A filter layer holds a *compound* criterion built from the selection surface:
 *   { id, enabled, mode: 'keep' | 'hide',
 *     catIds: string[], kindIds: string[], features: [{ feature, min, max }] }
 *
 * An annotation matches when it belongs to one of the chosen categories/kinds
 * (or none were chosen) AND satisfies every active feature range.
 */
export const matchesLayer = (
  a: ExtendedAnnotationObject,
  layer: LayerCriterion,
): boolean => {
  const hasCat = layer.catIds?.length || layer.kindIds?.length;
  let catOK = true;
  if (hasCat)
    catOK =
      (layer.catIds || []).includes(a.categoryId) ||
      (layer.kindIds || []).includes(a.kindId);
  let featOK = true;
  for (const f of layer.features || []) {
    const v = a.features?.[f.feature];
    if (v === undefined || !(v >= f.min && v <= f.max)) {
      featOK = false;
      break;
    }
  }
  return catOK && featOK;
};
export const baseSet = (
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
