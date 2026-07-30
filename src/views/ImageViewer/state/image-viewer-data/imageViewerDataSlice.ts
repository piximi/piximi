import { createSlice } from "@reduxjs/toolkit";
import { difference } from "lodash";

import { UNKNOWN_KIND_CATEGORY } from "store/dataV2/constants";
import type { FeatureKey } from "store/dataV2/types";

import { emptyFeatureState } from "./utils";

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
  selectedAnnotationIds: [],
  zLinking: { active: false, annIds: {} },
  filterLayer: undefined,
  planeScope: "current",
  selectionLayer: { catIds: [], features: emptyFeatureState() },
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

    addSelectedAnnotationId(state, action: PayloadAction<string>) {
      state.selectedAnnotationIds.push(action.payload);
    },
    addSelectedAnnotationIds(
      state,
      action: PayloadAction<Array<string> | string>,
    ) {
      let ids = action.payload;
      if (!Array.isArray(ids)) ids = [ids];
      state.selectedAnnotationIds.push(...ids);
    },
    setSelectedAnnotationIds(
      state,
      action: PayloadAction<Array<string> | string>,
    ) {
      let ids = action.payload;
      if (!Array.isArray(ids)) ids = [ids];
      state.selectedAnnotationIds = ids;
    },

    removeSelectedAnnotationIds(
      state,
      action: PayloadAction<Array<string> | string>,
    ) {
      let ids = action.payload;
      if (!Array.isArray(ids)) ids = [ids];
      state.selectedAnnotationIds = difference(
        state.selectedAnnotationIds,
        ids,
      );
    },
    clearSelectionLayer(state) {
      state.selectionLayer = { catIds: [], features: emptyFeatureState() };
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
    toggleFeatureSelection(
      state,
      action: PayloadAction<{ key: FeatureKey; bounds: [number, number] }>,
    ) {
      const feat = state.selectionLayer.features[action.payload.key];
      feat.active = !feat.active;
      if (feat.active) {
        feat.min = action.payload.bounds[0];
        feat.max = action.payload.bounds[1];
      }
    },
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
