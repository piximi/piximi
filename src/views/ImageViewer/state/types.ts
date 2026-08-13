import type { FeatureKey } from "store/data/types";

export type ImageViewerDataState = {
  imageStack: string[];
  activeImageId?: string;
  previousImageId?: string;
  selectedCategory: Omit<CategoryNode, "count" | "sel">;
  highlightedCategory?: string;
  activeAnnotationIds: Array<string>;
  filterLayer?: FilterLayer;
  planeScope: PlaneScope;
  selectionLayer: SelectionLayer;
  zLinking: { active: boolean; annIds: Record<string, string> };
  hasUnsavedChanges?: boolean;
  imageIsLoading?: boolean;
};

export type PlaneScope = "current" | "stack";
/** Static config for a feature-filter row: label, unit, [min, max] bounds and slider step. */
export interface FeatureConfig {
  label: string;
  unit: string;
  bounds: [number, number];
  step: number;
}
/** A category enriched with the current selection/count for rendering. */
export interface CategoryNode {
  id: string;
  name: string;
  color: string;
  sel: boolean;
  count: number;
  kindId: string;
}

/** Editable UI state for one feature-filter row. */
export interface FeatureRangeState {
  active: boolean;
  min: number;
  max: number;
}
/** The full feature-filter state, keyed by feature. */
export type FeatureState = Record<FeatureKey, FeatureRangeState>;

/**
 * The live selection surface. Not a LayerCriterion: it carries editable slider
 * state (`FeatureState`) rather than baked ranges, so `selectSelectedAnnotations`
 * converts it before matching.
 *
 * `includeIds`/`excludeIds` are the pointer tool's manual per-annotation
 * overrides. An include is sticky — it survives every criterion change, because
 * it expresses something the criterion cannot. An exclude only refines the
 * current criterion's result, so adding a term drops the excludes that term
 * admits (scoped to that term's matches, never wholesale).
 */
export interface SelectionLayer {
  catIds: string[];
  features: FeatureState;
  includeIds: string[];
  excludeIds: string[];
}

/** A concrete numeric range criterion for one feature (baked into a layer). */
export interface FeatureRange {
  feature: FeatureKey;
  min: number;
  max: number;
}
/**
 * The matchable part of a filter layer (also the shape of the live selection
 * criterion). Every field is optional so partial criteria can be tested.
 *
 * `includeIds`/`excludeIds` modify the **predicate**, not the outcome: they force
 * `matchesLayer` to true/false for those ids. `applyFilterLayer` negates the
 * predicate for `mode: "hide"`, so on a hide layer `includeIds` means "hide
 * exactly these" and `excludeIds` means "exempt these from the hide".
 */
export interface LayerCriterion {
  catIds?: string[];
  kindIds?: string[];
  features?: FeatureRange[];
  includeIds?: string[];
  excludeIds?: string[];
}
export type LayerMode = "keep" | "hide";
/** The single non-destructive filter layer. */
export interface FilterLayer extends LayerCriterion {
  enabled: boolean;
  mode: LayerMode;
  catIds: string[];
  kindIds: string[];
  features: FeatureRange[];
  includeIds: string[];
  excludeIds: string[];
}
