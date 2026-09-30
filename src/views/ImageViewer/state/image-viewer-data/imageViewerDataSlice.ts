import { createSlice } from "@reduxjs/toolkit";
import { difference } from "lodash";

import { UNKNOWN_KIND_CATEGORY } from "core/entities";

import { projectReset } from "store/actions";

import { emptySelectionLayer } from "./utils";

import type { PayloadAction } from "@reduxjs/toolkit";

import type { ObjectFeature } from "core/entities";

import type {
  CategoryNode,
  FeatureConfig,
  FeatureParams,
  FilterLayer,
  ImageViewerDataState,
  LayerMode,
  PlaneScope,
} from "../types";

const initialState: ImageViewerDataState = {
  imageStack: [],
  imageIsLoading: true,
  activeImageId: undefined,
  activeAnnotationIds: [],
  selectedCategory: UNKNOWN_KIND_CATEGORY,
  highlightedCategory: undefined,
  hasUnsavedChanges: false,
  zLinking: { active: false, annIds: {} },
  filterLayer: undefined,
  planeScope: "current",
  selectionLayer: emptySelectionLayer(),
};

export const imageViewerDataSlice = createSlice({
  name: "imageViewerData",
  initialState,
  reducers: {
    resetState() {
      return initialState;
    },
    setImageIsLoading(state, action: PayloadAction<{ isLoading: boolean }>) {
      state.imageIsLoading = action.payload.isLoading;
    },
    setImageStack(state, action: PayloadAction<Array<string>>) {
      state.imageStack = action.payload;
    },
    setHasUnsavedChanges(state, action: PayloadAction<boolean>) {
      state.hasUnsavedChanges = action.payload;
    },

    addActiveAnnotationIds(
      state,
      action: PayloadAction<Array<string> | string>,
    ) {
      let ids = action.payload;
      if (!Array.isArray(ids)) {
        ids = [ids];
      }
      state.activeAnnotationIds.push(...ids);
    },
    setActiveAnnotationIds(state, action: PayloadAction<Array<string>>) {
      state.activeAnnotationIds = action.payload;
    },

    removeActiveAnnotationIds(
      state,
      action: PayloadAction<Array<string> | string>,
    ) {
      let ids = action.payload;
      if (!Array.isArray(ids)) ids = [ids];
      state.activeAnnotationIds = difference(state.activeAnnotationIds, ids);
    },
    setSelectedCategory(
      state,
      action: PayloadAction<Omit<CategoryNode, "sel" | "count" | "total">>,
    ) {
      state.selectedCategory = action.payload;
    },
    setActiveImageId(state, action: PayloadAction<string | undefined>) {
      state.activeImageId = action.payload;
    },

    updateHighlightedAnnotationCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>,
    ) {
      state.highlightedCategory = action.payload.categoryId;
    },

    clearSelectionLayer(state) {
      state.selectionLayer = emptySelectionLayer();
    },
    /**
     * Flip the manual selection state of specific annotations. `on` is decided by
     * the caller, not here — knowing whether an annotation is currently selected
     * needs its category and features, which this slice doesn't hold.
     */
    toggleAnnotationSelection(
      state,
      action: PayloadAction<{ ids: string[]; on: boolean }>,
    ) {
      const { ids, on } = action.payload;
      const inc = new Set(state.selectionLayer.includeIds);
      const exc = new Set(state.selectionLayer.excludeIds);
      ids.forEach((id) => {
        if (on) {
          inc.add(id);
          exc.delete(id);
        } else {
          exc.add(id);
          inc.delete(id);
        }
      });
      state.selectionLayer.includeIds = [...inc];
      state.selectionLayer.excludeIds = [...exc];
    },
    /**
     * Drop ids from both override sets — for annotations that no longer exist.
     * Stale entries are harmless while they sit there, since the selected set is
     * derived by intersecting with visible annotations, but they accumulate.
     */
    forgetAnnotationIds(state, action: PayloadAction<string[]>) {
      const ids = action.payload;
      if (!ids.length) return;
      state.selectionLayer.includeIds = difference(
        state.selectionLayer.includeIds,
        ids,
      );
      state.selectionLayer.excludeIds = difference(
        state.selectionLayer.excludeIds,
        ids,
      );
    },

    toggleCatSelection(
      state,
      action: PayloadAction<{ ids: string[]; on: boolean }>,
    ) {
      const { ids, on } = action.payload;
      const next = new Set(state.selectionLayer.catIds);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      state.selectionLayer.catIds = [...next];
    },
    /**
     * Fit the selection's explicit feature ranges into the current global bounds.
     * Only ever narrows: deleting the one huge annotation pulls a range that reached
     * the old limit down to the new one, and the narrowing is persisted so the stale
     * number cannot re-widen the filter later. A null side is pinned to the bound
     * and resolves to it on read, so it needs nothing here.
     */
    setGlobalFeatureBounds(state, action: PayloadAction<FeatureParams>) {
      const params = Object.entries(action.payload) as [
        ObjectFeature,
        FeatureConfig,
      ][];
      params.forEach(([key, cfg]) => {
        const [lo, hi] = cfg.bounds;
        const feat = state.selectionLayer.features[key];
        // A range with nothing left inside the new bounds has been invalidated
        // wholesale — every annotation it described is gone. Clamping it would
        // collapse both thumbs onto one end and read as a deliberate "exactly this
        // value" the user never chose, so the row is released to null and switched
        // off instead, which keeps the slider and the stored state congruent.
        //
        // The criterion is a pipeline: dropping an invalidated stage gives up the
        // narrowing it contributed, so the selection widens to whatever the remaining
        // terms match. That is intended — a stage describing no data has no business
        // narrowing anything — and it is why this makes no attempt to preserve the
        // previously selected set.
        if ((feat.min ?? lo) > hi || (feat.max ?? hi) < lo) {
          feat.min = null;
          feat.max = null;
          feat.active = false;
          return;
        }
        if (feat.min !== null) feat.min = Math.min(Math.max(feat.min, lo), hi);
        if (feat.max !== null) feat.max = Math.max(Math.min(feat.max, hi), lo);
      });
    },
    toggleFeatureSelection(state, action: PayloadAction<ObjectFeature>) {
      const feat = state.selectionLayer.features[action.payload];
      feat.active = !feat.active;
    },

    updateFeatureSelection(
      state,
      action: PayloadAction<{ key: ObjectFeature; range: [number, number] }>,
    ) {
      const feat = state.selectionLayer.features[action.payload.key];
      feat.min = action.payload.range[0];
      feat.max = action.payload.range[1];
    },
    setFilterLayer(state, action: PayloadAction<FilterLayer>) {
      state.filterLayer = action.payload;
    },
    toggleFilterLayer(state) {
      if (state.filterLayer) {
        state.filterLayer.enabled = !state.filterLayer.enabled;
      }
    },
    // Whether the layer keeps or hides its matches is a property of the layer,
    // editable on its row — not a choice made before there is a layer at all.
    setFilterLayerMode(state, action: PayloadAction<LayerMode>) {
      if (state.filterLayer) {
        state.filterLayer.mode = action.payload;
      }
    },
    deleteFilterLayer(state) {
      state.filterLayer = undefined;
    },
    setPlaneScope(state, action: PayloadAction<PlaneScope>) {
      state.planeScope = action.payload;
    },

    toggleZLinking(state, action: PayloadAction<boolean>) {
      state.zLinking.active = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(projectReset, () => ({ ...initialState }));
  },
});
