import { createSlice } from "@reduxjs/toolkit";
import { difference } from "lodash";

import { UNKNOWN_KIND_CATEGORY } from "store/data/constants";
import type { FeatureKey } from "store/data/types";

import { emptySelectionLayer } from "./utils";

import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  CategoryNode,
  FilterLayer,
  ImageViewerDataState,
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
      action: PayloadAction<Omit<CategoryNode, "sel" | "count">>,
    ) {
      state.selectedCategory = action.payload;
    },
    setActiveImageId(state, action: PayloadAction<string | undefined>) {
      state.activeImageId = action.payload;
      // reset selected annotations
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
    /**
     * `admits` are the annotation ids the categories being switched on match.
     * Adding a term drops manual exclusions among its own matches only, so
     * checking a second category leaves the first category's exclusions alone.
     * Switching a category off clears nothing.
     */
    toggleCatSelection(
      state,
      action: PayloadAction<{ ids: string[]; on: boolean; admits?: string[] }>,
    ) {
      const { ids, on, admits } = action.payload;
      const next = new Set(state.selectionLayer.catIds);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      state.selectionLayer.catIds = [...next];
      if (on && admits?.length)
        state.selectionLayer.excludeIds = difference(
          state.selectionLayer.excludeIds,
          admits,
        );
    },
    toggleFeatureSelection(
      state,
      action: PayloadAction<{
        key: FeatureKey;
        bounds: [number, number];
        admits?: string[];
      }>,
    ) {
      const feat = state.selectionLayer.features[action.payload.key];
      feat.active = !feat.active;
      if (feat.active) {
        feat.min = action.payload.bounds[0];
        feat.max = action.payload.bounds[1];
        if (action.payload.admits?.length)
          state.selectionLayer.excludeIds = difference(
            state.selectionLayer.excludeIds,
            action.payload.admits,
          );
      }
    },
    // Deliberately takes no `admits` and clears no exclusions: dragging the
    // bounds of an already-active range must not wipe manual deselections, or
    // tuning a slider silently discards them on the first pixel of movement.
    updateFeatureSelection(
      state,
      action: PayloadAction<{ key: FeatureKey; range: [number, number] }>,
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
});
