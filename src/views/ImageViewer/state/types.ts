import type { FeatureKey } from "store/dataV2/types";

export type ImageViewerDataState = {
  imageStack: string[];
  activeImageId?: string;
  previousImageId?: string;
  selectedCategory: Omit<CategoryNode, "count" | "sel">;
  highlightedCategory?: string;
  activeAnnotationIds: Array<string>;
  selectedAnnotationIds: Array<string>;
  filterLayer?: FilterLayer;
  planeScope: PlaneScope;
  selectionLayer: { catIds: Array<string>; features: FeatureState };
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

/** A concrete numeric range criterion for one feature (baked into a layer). */
export interface FeatureRange {
  feature: FeatureKey;
  min: number;
  max: number;
}
/**
 * The matchable part of a filter layer (also the shape of the live selection
 * criterion). Every field is optional so partial criteria can be tested.
 */
export interface LayerCriterion {
  catIds?: string[];
  kindIds?: string[];
  features?: FeatureRange[];
}
export type LayerMode = "keep" | "hide";
/** The single non-destructive filter layer. */
export interface FilterLayer extends LayerCriterion {
  enabled: boolean;
  mode: LayerMode;
  catIds: string[];
  kindIds: string[];
  features: FeatureRange[];
}
