import { createSlice } from "@reduxjs/toolkit";
import { difference } from "lodash";

import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import { UNKNOWN_KIND } from "store/dataV2/constants";

import { findAdjacentItem, mutatingFilter } from "utils/arrayUtils";
import type { Partition } from "utils/dl/enums";
import { representsUnknown } from "utils/stringUtils";

import { AnnotationSortType, ImageSortType } from "./types";

import type { KindState, ProjectState, ViewState } from "./types";
import type { PayloadAction } from "@reduxjs/toolkit";

const emptyKindState = (id: string, name: string): KindState => ({
  id,
  name,
  selectedIds: [],
  filters: { categoryId: [], partition: [] },
  visible: true,
  sortType: AnnotationSortType.None,
});
export const initialState: ProjectState = {
  name: "Untitled project",
  activeView: "images",
  imageGridState: {
    selectedIds: [],
    filters: { categoryId: [], partition: [] },
    sortType: ImageSortType.None,
  },
  annotationGridState: {
    activeKindId: UNKNOWN_KIND.id,
    kindStates: {
      [UNKNOWN_KIND.id]: emptyKindState(UNKNOWN_KIND.id, UNKNOWN_KIND.name),
    },
  },
  highlightedCategory: undefined,
  imageChannels: undefined,
};

function handleImageCategoryDelete(
  state: ProjectState,
  categoryId: string,
): boolean {
  let handled = false;
  const imFilters = state.imageGridState.filters.categoryId;
  const initLen = imFilters.length;
  mutatingFilter(imFilters, (id) => id !== categoryId);
  if (imFilters.length !== initLen) {
    handled = true;
  }

  return handled;
}

function handleAnnCategoryDelete(state: ProjectState, categoryId: string) {
  const kindStates = Object.values(state.annotationGridState.kindStates);
  for (let i = 0; i < kindStates.length; i++) {
    const kindState = kindStates[i];
    const filters = kindState.filters.categoryId;
    const initLength = filters.length;

    mutatingFilter(filters, (id) => id !== categoryId);

    if (initLength !== filters.length) break;
  }
}

export const projectSlice = createSlice({
  name: "project",
  initialState: initialState,
  reducers: {
    resetProject() {
      return initialState;
    },
    setProjectImageChannels(
      state,
      action: PayloadAction<{ channels: number | undefined }>,
    ) {
      state.imageChannels = action.payload.channels;
    },

    setProject(state, action: PayloadAction<{ project: ProjectState }>) {
      return action.payload.project;
    },
    setActiveView(state, action: PayloadAction<ViewState>) {
      state.activeView = action.payload;
    },

    // ~~ Image Grid State
    addSelectedImages(state, action: PayloadAction<string[]>) {
      const ids = action.payload;
      const newIds = difference(ids, state.imageGridState.selectedIds);
      state.imageGridState.selectedIds.push(...newIds);
    },
    removeSelectedImages(state, action: PayloadAction<string[]>) {
      mutatingFilter(
        state.imageGridState.selectedIds,
        (id) => !action.payload.includes(id),
      );
    },
    setImageSortType(state, action: PayloadAction<ImageSortType>) {
      state.imageGridState.sortType = action.payload;
    },

    addImageCategoryFilters(state, action: PayloadAction<string[]>) {
      const ids = action.payload;
      const newIds = difference(ids, state.imageGridState.filters.categoryId);
      state.imageGridState.filters.categoryId.push(...newIds);
    },
    removeImageCategoryFilters(state, action: PayloadAction<string[]>) {
      const ids = action.payload;

      mutatingFilter(
        state.imageGridState.filters.categoryId,
        (id) => !ids.includes(id),
      );
    },
    addImagePartitionFilters(state, action: PayloadAction<Partition[]>) {
      const ids = action.payload;
      const newIds = difference(ids, state.imageGridState.filters.partition);
      state.imageGridState.filters.partition.push(...newIds);
    },
    removeImagePartitionFilters(state, action: PayloadAction<Partition[]>) {
      const ids = action.payload;

      mutatingFilter(
        state.imageGridState.filters.partition,
        (id) => !ids.includes(id),
      );
    },

    // ~~ Annotation Grid State
    setActiveKind(state, action: PayloadAction<string>) {
      if (!state.annotationGridState.kindStates[action.payload]) return;
      state.annotationGridState.activeKindId = action.payload;
    },
    addSelectedAnnotations(
      state,
      action: PayloadAction<{ kindId: string; ids: string[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      const newIds = difference(ids, kindState.selectedIds);
      kindState.selectedIds.push(...newIds);
    },
    removeSelectedAnnotations(
      state,
      action: PayloadAction<{ kindId: string; ids: string[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      mutatingFilter(kindState.selectedIds, (id) => !ids.includes(id));
    },
    setAnnotationSortType(
      state,
      action: PayloadAction<{ kindId: string; sortType: AnnotationSortType }>,
    ) {
      const { kindId, sortType } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      kindState.sortType = sortType;
    },

    addAnnotationCategoryFilters(
      state,
      action: PayloadAction<{ kindId: string; ids: string[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      const newIds = difference(ids, kindState.filters.categoryId);
      kindState.filters.categoryId.push(...newIds);
    },
    removeAnnotationCategoryFilters(
      state,
      action: PayloadAction<{ kindId: string; ids: string[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;

      mutatingFilter(kindState.filters.categoryId, (id) => !ids.includes(id));
    },
    addAnnotationPartitionFilters(
      state,
      action: PayloadAction<{ kindId: string; ids: Partition[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;
      const newIds = difference(ids, kindState.filters.partition);
      kindState.filters.partition.push(...newIds);
    },
    removeAnnotationPartitionFilters(
      state,
      action: PayloadAction<{ kindId: string; ids: Partition[] }>,
    ) {
      const { kindId, ids } = action.payload;
      const kindState = state.annotationGridState.kindStates[kindId];
      if (!kindState) return;

      mutatingFilter(kindState.filters.partition, (id) => !ids.includes(id));
    },
    setKindTabVisibility(
      state,
      action: PayloadAction<{ kindId: string; visible: boolean }>,
    ) {
      const kindState =
        state.annotationGridState.kindStates[action.payload.kindId];
      if (kindState) kindState.visible = action.payload.visible;
    },
    setAllKindTabVisibility(state, action: PayloadAction<boolean>) {
      for (const kindId in state.annotationGridState.kindStates) {
        state.annotationGridState.kindStates[kindId].visible = action.payload;
      }
    },
    updateHighlightedCategory(
      state,
      action: PayloadAction<{ categoryId: string | undefined }>,
    ) {
      state.highlightedCategory = action.payload.categoryId;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(dataSliceV2.actions.setState, (state, action) => {
        const { kinds } = action.payload;
        state.imageGridState = { ...initialState.imageGridState };

        state.annotationGridState.kindStates = {};
        let unknownKindId = "";
        for (const kind of kinds) {
          if (representsUnknown(kind.id)) unknownKindId = kind.id;
          state.annotationGridState.kindStates[kind.id] = emptyKindState(
            kind.id,
            kind.name,
          );
        }
        state.annotationGridState.activeKindId = unknownKindId;
        state.activeView = "images";
      })
      .addCase(dataSliceV2.actions.newExperiment, (state) => {
        state.annotationGridState = { ...initialState.annotationGridState };
        state.imageGridState.filters.categoryId = [];
        state.imageGridState.filters.categoryId = [];
        state.imageGridState.selectedIds = [];
      })
      .addCase(dataSliceV2.actions.addKind, (state, action) => {
        state.annotationGridState.kindStates[action.payload.kind.id] =
          emptyKindState(action.payload.kind.id, action.payload.kind.name);
      })
      .addCase(dataSliceV2.actions.batchAddKind, (state, action) => {
        for (const { kind } of action.payload) {
          state.annotationGridState.kindStates[kind.id] = emptyKindState(
            kind.id,
            kind.name,
          );
        }
      })
      .addCase(dataSliceV2.actions.updateKindName, (state, action) => {
        state.annotationGridState.kindStates[action.payload.kindId].name =
          action.payload.name;
      })
      .addCase(dataSliceV2.actions.deleteKind, (state, action) => {
        if (state.annotationGridState.activeKindId === action.payload)
          state.annotationGridState.activeKindId = findAdjacentItem(
            Object.keys(state.annotationGridState.kindStates),
            action.payload,
          );
        delete state.annotationGridState.kindStates[action.payload];
      })
      .addCase(dataSliceV2.actions.deleteImageCategory, (state, action) => {
        handleImageCategoryDelete(state, action.payload);
      })
      .addCase(
        dataSliceV2.actions.deleteAnnotationCategory,
        (state, action) => {
          handleAnnCategoryDelete(state, action.payload);
        },
      )
      .addCase(dataSliceV2.actions.deleteCategory, (state, action) => {
        const catId = action.payload;
        const handled = handleImageCategoryDelete(state, catId);
        if (handled) return;
        handleAnnCategoryDelete(state, catId);
      });
  },
});
